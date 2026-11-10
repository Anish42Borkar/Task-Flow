import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProjectMemberGuard } from '../auth/guards/project-member.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.projectsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @UseGuards(ProjectMemberGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.findOne(id, user.id, user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') creatorId: string,
  ) {
    return this.projectsService.create(dto, creatorId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async addMembers(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.projectsService.addMembers(projectId, body.userIds);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async removeMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.projectsService.removeMember(projectId, userId);
  }
}
