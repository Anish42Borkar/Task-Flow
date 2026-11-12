import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesService, UpdateRolePermissionInput } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @Roles('admin')
  async findAll() {
    return this.rolesService.findAll();
  }

  @Post('roles')
  @Roles('admin')
  async createRole(@Body() body: { name: string; description?: string }) {
    return this.rolesService.createRole(body.name, body.description);
  }

  @Put('roles/:id')
  @Roles('admin')
  async updateRole(
    @Param('id') roleId: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.rolesService.updateRole(roleId, body);
  }

  @Delete('roles/:id')
  @Roles('admin')
  async deleteRole(
    @Param('id') roleId: string,
    @Query('reassignTo') reassignTo?: string,
  ) {
    return this.rolesService.deleteRole(roleId, reassignTo);
  }

  @Get('permissions/:roleId')
  @Roles('admin')
  async getPermissions(@Param('roleId') roleId: string) {
    return this.rolesService.getRolePermissions(roleId);
  }

  @Put('permissions/:roleId')
  @Roles('admin')
  async updatePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { permissions: UpdateRolePermissionInput[] },
  ) {
    return this.rolesService.updateRolePermissions(roleId, body.permissions);
  }
}
