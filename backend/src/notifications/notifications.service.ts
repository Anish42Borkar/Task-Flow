import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(userId: string) {
    const list = await this.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));

    const unreadCount = list.filter((n) => !n.isRead).length;

    return {
      notifications: list,
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string) {
    const [updated] = await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, userId));

    return { success: true, message: 'All notifications marked as read' };
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    referenceId?: string,
  ) {
    const [notification] = await this.db
      .insert(schema.notifications)
      .values({
        userId,
        title,
        message,
        type,
        referenceId: referenceId || null,
        isRead: false,
      })
      .returning();

    // Real-time dispatch via Socket.IO
    this.eventsGateway.sendToUser(userId, 'notification:new', notification);

    return notification;
  }
}
