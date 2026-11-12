import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ProjectMemberGuard } from '../auth/guards/project-member.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks')
  @RequirePermission('tasks', 'canView')
  async getAllTasks(@CurrentUser() actor: any) {
    return this.tasksService.getAllTasksForUser(actor);
  }

  @Get('projects/:projectId/tasks')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canView')
  async getTasksByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.tasksService.getTasksByProject(projectId);
  }

  @Post('projects/:projectId/tasks')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canCreate')
  async createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.createTask(projectId, dto, actor);
  }

  @Patch('projects/:projectId/tasks/reorder')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canEdit')
  async reorderTasks(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: ReorderTasksDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.reorderTasks(projectId, dto.orderedTaskIds, actor);
  }

  @Patch('tasks/reorder')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canEdit')
  async reorderTasksGeneral(
    @Body() dto: { projectId?: string; orderedTaskIds: string[] },
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.reorderTasks(dto.projectId || '', dto.orderedTaskIds, actor);
  }

  @Get('tasks/:id')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canView')
  async getTaskById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.getTaskById(id);
  }

  @Put('tasks/:id')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canEdit')
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.updateTask(id, dto, actor);
  }

  @Patch('tasks/:id/status')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canEdit')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.updateStatus(id, status, actor);
  }

  @Delete('tasks/:id')
  @UseGuards(ProjectMemberGuard)
  @RequirePermission('tasks', 'canDelete')
  async deleteTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.deleteTask(id, actor);
  }
}
