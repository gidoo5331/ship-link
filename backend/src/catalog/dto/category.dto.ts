import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cars' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({
    example: ['Make', 'Model', 'Year', 'Mileage'],
    description:
      'Spec labels pre-filled when a product is added to this category',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  specTemplate?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
