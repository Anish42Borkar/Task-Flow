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
    let list = await this.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));

    // If user has no notifications yet, generate helpful initial notifications
    if (list.length === 0) {
      try {
        const welcomeNotifications = [
          {
            userId,
            title: 'Welcome to TaskFlow',
            message: 'Track tasks, manage projects, and collaborate with your team with real-time updates.',
            type: 'info',
            isRead: false,
          },
          {
            userId,
            title: 'Workspace Active',
            message: 'You have active access to your project workspace. Check your tasks to get started.',
            type: 'project_assigned',
            isRead: false,
          },
        ];

        await this.db.insert(schema.notifications).values(welcomeNotifications);

        list = await this.db
          .select()
          .from(schema.notifications)
          .where(eq(schema.notifications.userId, userId))
          .orderBy(desc(schema.notifications.createdAt));
      } catch (err) {
        console.warn('Error creating starter notifications:', err);
      }
    }

    const unreadCount = list.filter((n) => !n.isRead).length;

    return {
      notifications: list,
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string) {
    try {
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

      return updated || { id, isRead: true };
    } catch (err) {
      return { id, isRead: true };
    }
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, userId));

    return { success: true, message: 'All notifications marked as read' };
  }

  async remove(id: string, userId: string) {
    await this.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, userId),
        ),
      );

    return { success: true, message: 'Notification deleted', id };
  }

  async clearAll(userId: string) {
    await this.db
      .delete(schema.notifications)
      .where(eq(schema.notifications.userId, userId));

    return { success: true, message: 'All notifications cleared' };
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
