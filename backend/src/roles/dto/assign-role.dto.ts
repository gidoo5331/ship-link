import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ description: 'ID of the staff member to assign this role to' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;
}