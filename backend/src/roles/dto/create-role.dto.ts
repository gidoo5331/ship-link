import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RESOURCES } from 'src/shared';
import type { Action, Resource } from 'src/shared';

class PermissionDto {
  @ApiProperty({ enum: RESOURCES })
  @IsEnum(RESOURCES as unknown as object)
  resource!: Resource;

  @ApiProperty({ example: ['create', 'read', 'update', 'delete'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  actions!: Action[];
}

export class CreateRoleDto {
  @ApiProperty({ example: 'Freight Manager' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Manages shipments and logistics' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [PermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  @ArrayMinSize(1, { message: 'At least one permission is required' })
  permissions!: PermissionDto[];
}