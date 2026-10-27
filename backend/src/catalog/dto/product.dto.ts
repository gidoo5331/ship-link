import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProductAvailability, RentalUnit } from 'generated/prisma/enums';

export const MAX_IMAGES_PER_PRODUCT = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export class ProductSpecDto {
  @ApiProperty({ example: 'Mileage' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label!: string;

  @ApiProperty({ example: '38,000 mi' })
  @IsString()
  @MaxLength(200)
  value!: string;
}

export class ProductRentalDto {
  @ApiProperty({ example: 600 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate!: number;

  @ApiPropertyOptional({ example: 'GHS', enum: ['USD', 'GHS'], default: 'GHS' })
  @IsOptional()
  @IsIn(['USD', 'GHS'])
  currency?: string;

  @ApiPropertyOptional({ enum: RentalUnit, default: RentalUnit.DAY })
  @IsOptional()
  @IsEnum(RentalUnit)
  unit?: RentalUnit;

  @ApiPropertyOptional({ example: 'With driver. GH₵2,000 refundable deposit.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

// Status is not settable here: products are always created as drafts and
// only go live through the publish endpoint.
export class CreateProductDto {
  @ApiProperty({ example: '2021 Toyota Camry' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: 'A sleek, fuel-efficient sedan…' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 22500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ example: 'USD', enum: ['USD', 'GHS'] })
  @IsOptional()
  @IsIn(['USD', 'GHS'])
  currency?: string;

  @ApiPropertyOptional({ enum: ProductAvailability })
  @IsOptional()
  @IsEnum(ProductAvailability)
  availability?: ProductAvailability;

  @ApiPropertyOptional({ example: '6–8 weeks' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  leadTime?: string | null;

  @ApiPropertyOptional({ description: 'false = rent only', default: true })
  @IsOptional()
  @IsBoolean()
  forSale?: boolean;

  @ApiPropertyOptional({
    type: ProductRentalDto,
    nullable: true,
    description: 'Set to offer it for rent; null stops renting it',
  })
  @IsOptional()
  @ValidateIf((o: CreateProductDto) => o.rental !== null)
  @ValidateNested()
  @Type(() => ProductRentalDto)
  rental?: ProductRentalDto | null;

  @ApiPropertyOptional({ type: [ProductSpecDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  specs?: ProductSpecDto[];

  @ApiPropertyOptional({ example: ['Leather seats', 'Reverse camera'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  features?: string[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description:
      'Ordered image keys (first = cover). Keys must come from the upload-url endpoint.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_IMAGES_PER_PRODUCT)
  @IsString({ each: true })
  images?: string[];
}

export class CreateImageUploadDto {
  @ApiProperty({ enum: IMAGE_CONTENT_TYPES })
  @IsIn(IMAGE_CONTENT_TYPES)
  contentType!: (typeof IMAGE_CONTENT_TYPES)[number];

  @ApiProperty({ description: 'File size in bytes', example: 524288 })
  @IsInt()
  @Min(1)
  @Max(MAX_IMAGE_BYTES)
  size!: number;
}
