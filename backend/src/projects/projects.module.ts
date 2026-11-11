import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [NotificationsModule, EventsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
