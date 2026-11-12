import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(
    user: { id: string; email: string; roleId?: string; role?: string },
    userAgent?: string,
  ) {
    const role = user.roleId || user.role || 'user';
    const accessPayload = { sub: user.id, email: user.email, role };
    const accessToken = this.jwtService.sign(accessPayload);

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'taskflow_super_secret_refresh_jwt_key_2026_dev_mode',
    );
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    const refreshPayload = {
      sub: user.id,
      tokenType: 'refresh',
      jti: crypto.randomUUID(),
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration,
    });

    // Calculate expiry timestamp (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save hashed refresh token to database
    const tokenHash = this.hashToken(refreshToken);
    await this.db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: userAgent ? userAgent.substring(0, 255) : null,
    });

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto, userAgent?: string) {
    const email = registerDto.email.toLowerCase().trim();

    const [existing] = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      throw new BadRequestException('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const [newUser] = await this.db
      .insert(schema.users)
      .values({
        fullName: registerDto.fullName.trim(),
        email,
        passwordHash,
        roleId: 'user', // Default registered user role
        phone: registerDto.phone?.trim() || null,
        department: registerDto.department?.trim() || null,
        isActive: true,
        lastLoginAt: new Date(),
      })
      .returning({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
        department: schema.users.department,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      });

    const tokens = await this.generateTokens(newUser, userAgent);

    return {
      ...tokens,
      user: newUser,
    };
  }

  async login(loginDto: LoginDto, userAgent?: string) {
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

    const tokens = await this.generateTokens(user, userAgent);

    return {
      ...tokens,
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

  async refreshTokens(refreshToken: string, userAgent?: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'taskflow_super_secret_refresh_jwt_key_2026_dev_mode',
    );

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload?.sub || payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const tokenHash = this.hashToken(refreshToken);
    const [storedToken] = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.tokenHash, tokenHash))
      .limit(1);

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token is invalid or does not exist');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has already been revoked or used');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old refresh token (Token Rotation)
    await this.db
      .update(schema.refreshTokens)
      .set({ isRevoked: true })
      .where(eq(schema.refreshTokens.id, storedToken.id));

    // Verify user is still active
    const [user] = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        roleId: schema.users.roleId,
        isActive: schema.users.isActive,
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    // Generate new token pair
    const tokens = await this.generateTokens(user, userAgent);

    return tokens;
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.db
        .update(schema.refreshTokens)
        .set({ isRevoked: true })
        .where(eq(schema.refreshTokens.tokenHash, tokenHash));
    }

    return { success: true, message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.db
      .update(schema.refreshTokens)
      .set({ isRevoked: true })
      .where(
        and(
          eq(schema.refreshTokens.userId, userId),
          eq(schema.refreshTokens.isRevoked, false),
        ),
      );

    return { success: true, message: 'Logged out from all active sessions' };
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
        joinedOn: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Unknown',
        lastLogin: user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleString()
          : 'Never',
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
