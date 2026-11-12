import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as schema from './schema';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    const dbSsl = this.configService.get<string>('DB_SSL') === 'true';

    const poolConfig: PoolConfig = {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    if (databaseUrl) {
      poolConfig.connectionString = databaseUrl;
      if (dbSsl || databaseUrl.includes('render.com') || databaseUrl.includes('sslmode=require')) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
    } else {
      poolConfig.host = this.configService.get<string>('DB_HOST', '127.0.0.1');
      poolConfig.port = this.configService.get<number>('DB_PORT', 5432);
      poolConfig.user = this.configService.get<string>('DB_USER', 'postgres');
      poolConfig.password = this.configService.get<string>('DB_PASSWORD', 'postgres');
      poolConfig.database = this.configService.get<string>('DB_NAME', 'taskflow');
      if (dbSsl) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
    }

    this.pool = new Pool(poolConfig);
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      this.logger.log('Successfully connected to PostgreSQL database.');
      client.release();

      // Automatically apply pending Drizzle migrations if migration folder exists
      await this.runMigrations();

      // Ensure refresh_tokens table exists as a resilient fallback
      await this.ensureRefreshTokensTable();
    } catch (error: any) {
      this.logger.error(
        'Database connection or migration issue: ' + error.message,
      );

      // Attempt fallback table creation even if migration runner encountered an error
      try {
        await this.ensureRefreshTokensTable();
      } catch (err: any) {
        this.logger.error('Fallback table creation failed: ' + err.message);
      }
    }
  }

  private async runMigrations() {
    const possibleMigrationPaths = [
      path.resolve(process.cwd(), 'drizzle'),
      path.resolve(process.cwd(), 'backend', 'drizzle'),
      path.resolve(__dirname, '../../../../drizzle'),
      path.resolve(__dirname, '../../../drizzle'),
    ];

    const migrationFolder = possibleMigrationPaths.find((p) => fs.existsSync(p));

    if (!migrationFolder) {
      this.logger.warn('Drizzle migration folder not found at runtime; relying on table verification.');
      return;
    }

    try {
      // 1. Ensure drizzle schema and migrations tracking table exist
      await this.pool.query(`
        CREATE SCHEMA IF NOT EXISTS "drizzle";
        CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        );
      `);

      // 2. Check if tables already exist in PostgreSQL (e.g. from prior setup/seed)
      const tableCheck = await this.pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'role_permissions'
        ) as exists;
      `);

      const tablesExist = Boolean(tableCheck.rows[0]?.exists);

      if (tablesExist) {
        const migrationCheck = await this.pool.query(`
          SELECT count(*) as count FROM "drizzle"."__drizzle_migrations";
        `);
        const recordedCount = Number(migrationCheck.rows[0]?.count || 0);

        if (recordedCount === 0) {
          // Tables were previously created; record existing migrations to prevent duplicate table creation errors
          const journalPath = path.join(migrationFolder, 'meta', '_journal.json');
          if (fs.existsSync(journalPath)) {
            const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
            for (const entry of journal.entries || []) {
              const sqlPath = path.join(migrationFolder, `${entry.tag}.sql`);
              let hash = 'migrated';
              if (fs.existsSync(sqlPath)) {
                const sqlContent = fs.readFileSync(sqlPath, 'utf8');
                hash = crypto.createHash('sha256').update(sqlContent).digest('hex');
              }
              await this.pool.query(
                `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2);`,
                [hash, entry.when],
              );
            }
            this.logger.log('Existing database tables detected. Synchronized Drizzle migration records.');
            return;
          }
        }
      }

      this.logger.log(`Running database migrations from: ${migrationFolder}`);
      await migrate(this.db, { migrationsFolder: migrationFolder });
      this.logger.log('Database migrations applied successfully.');
    } catch (err: any) {
      if (
        err.message?.includes('already exists') ||
        err.code === '42P07' ||
        err.code === '42710'
      ) {
        this.logger.log('Database tables already synchronized in PostgreSQL.');
      } else {
        throw err;
      }
    }
  }

  private async ensureRefreshTokensTable() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS "refresh_tokens" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "token_hash" varchar(255) NOT NULL,
          "expires_at" timestamp with time zone NOT NULL,
          "is_revoked" boolean DEFAULT false NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "user_agent" varchar(255)
        );
        CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_hash" ON "refresh_tokens" ("token_hash");
        CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id");
      `);
      this.logger.log('Verified "refresh_tokens" table and indexes in PostgreSQL.');
    } catch (err: any) {
      this.logger.warn('Could not verify "refresh_tokens" table: ' + err.message);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL connection pool closed.');
  }
}
