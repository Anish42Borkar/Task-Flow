import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, loginDto.email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is currently disabled. Please contact an admin.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login timestamp
    await this.db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    const payload = { sub: user.id, email: user.email, role: user.roleId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.roleId,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }

  async getMe(userId: string) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
        department: schema.users.department,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // Fetch user permissions for their role
    const permissions = await this.db
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, user.role));

    return {
      user: {
        ...user,
        joinedOn: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown',
        lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
      },
      permissions,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updatePayload: Partial<schema.User> = {};
    if (dto.fullName) updatePayload.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) updatePayload.phone = dto.phone?.trim() || null;
    if (dto.department !== undefined) updatePayload.department = dto.department?.trim() || null;
    updatePayload.updatedAt = new Date();

    const [updatedUser] = await this.db
      .update(schema.users)
      .set(updatePayload)
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
        department: schema.users.department,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
      });

    return updatedUser;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const [user] = await this.db
      .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password does not match our records');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.db
      .update(schema.users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    return { success: true, message: 'Password updated successfully' };
  }
}
