import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, ilike, or, and, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(page = 1, limit = 20, search?: string, roleId?: string, isActive?: boolean) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(schema.users.fullName, `%${search}%`),
          ilike(schema.users.email, `%${search}%`),
        ),
      );
    }

    if (roleId && roleId !== 'all') {
      conditions.push(eq(schema.users.roleId, roleId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(schema.users.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        roleId: schema.users.roleId,
        department: schema.users.department,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(whereClause)
      .orderBy(desc(schema.users.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        roleId: schema.users.roleId,
        department: schema.users.department,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const [existing] = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, dto.email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [created] = await this.db
      .insert(schema.users)
      .values({
        fullName: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        roleId: dto.roleId,
        department: dto.department?.trim() || null,
        phone: dto.phone?.trim() || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      })
      .returning({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        roleId: schema.users.roleId,
        department: schema.users.department,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      });

    return created;
  }

  async update(id: string, dto: UpdateUserDto) {
    const [existing] = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatePayload: Partial<schema.User> = { updatedAt: new Date() };
    if (dto.fullName) updatePayload.fullName = dto.fullName.trim();
    if (dto.email) updatePayload.email = dto.email.toLowerCase().trim();
    if (dto.roleId) updatePayload.roleId = dto.roleId;
    if (dto.department !== undefined) updatePayload.department = dto.department?.trim() || null;
    if (dto.phone !== undefined) updatePayload.phone = dto.phone?.trim() || null;
    if (dto.isActive !== undefined) updatePayload.isActive = dto.isActive;
    if (dto.password) {
      updatePayload.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const [updated] = await this.db
      .update(schema.users)
      .set(updatePayload)
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        roleId: schema.users.roleId,
        department: schema.users.department,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
      });

    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });

    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return { success: true, message: `User ${id} removed` };
  }
}
