import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddStaffDto {
  @ApiProperty({ example: 'Joseph' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName!: string;

  @ApiProperty({ example: 'Owusu' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName!: string;

  @ApiProperty({ example: 'joseph@ghmotors.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+233 24 000 0000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Role to assign. Defaults to the company’s "Full Access" role.',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}

export class SetStaffActiveDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive!: boolean;
}
