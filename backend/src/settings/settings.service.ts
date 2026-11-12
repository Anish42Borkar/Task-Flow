import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getSettings() {
    let [setting] = await this.db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.id, 'default'))
      .limit(1);

    if (!setting) {
      const [created] = await this.db
        .insert(schema.systemSettings)
        .values({
          id: 'default',
          appName: 'TaskFlow',
          theme: 'Light',
          timezone: '(GMT+05:30) India Standard Time',
          dateFormat: 'DD MMM, YYYY (e.g. 28 Oct, 2026)',
          twoFactor: false,
        })
        .returning();
      setting = created;
    }

    return setting;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    // Ensure default row exists
    await this.getSettings();

    const updateData: Partial<schema.NewSystemSetting> = {
      updatedAt: new Date(),
    };

    if (dto.appName !== undefined) updateData.appName = dto.appName.trim();
    if (dto.theme !== undefined) updateData.theme = dto.theme;
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
    if (dto.dateFormat !== undefined) updateData.dateFormat = dto.dateFormat;
    if (dto.twoFactor !== undefined) updateData.twoFactor = dto.twoFactor;

    const [updated] = await this.db
      .update(schema.systemSettings)
      .set(updateData)
      .where(eq(schema.systemSettings.id, 'default'))
      .returning();

    return updated;
  }
}
