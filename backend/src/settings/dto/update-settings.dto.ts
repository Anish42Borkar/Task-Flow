import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsBoolean()
  twoFactor?: boolean;
}
