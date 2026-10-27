import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadType } from 'generated/prisma/enums';
import { CreateCustomerDto } from 'src/customers/dto/customer.dto';

// Sent by the public website — no login
export class CreatePublicLeadDto {
  @ApiPropertyOptional({
    enum: LeadType,
    default: LeadType.PURCHASE,
    description: 'RENTAL needs a productId that is for rent',
  })
  @IsOptional()
  @IsEnum(LeadType)
  type?: LeadType;

  @ApiProperty({ example: 'Akosua Boateng' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: '024 555 0133' })
  @IsString()
  @Matches(/(\d.*){9,}/, {
    message: 'Enter a phone number with at least 9 digits',
  })
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ example: 'Kumasi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'The product they are interested in',
  })
  @ValidateIf((o: CreatePublicLeadDto) => !o.customRequest)
  @IsUUID(undefined, {
    message: 'Choose a product or describe what you are looking for',
  })
  productId?: string;

  @ApiPropertyOptional({
    example: 'A 2022 Toyota Camry, white, under USD 28,000',
  })
  @ValidateIf((o: CreatePublicLeadDto) => !o.productId)
  @IsString()
  @MinLength(5, {
    message: 'Tell us a little more about what you are looking for',
  })
  @MaxLength(1000)
  customRequest?: string;

  @ApiPropertyOptional({
    example: 'GADDO-ACC',
    description: 'Agent referral code or name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  referralCode?: string;

  // Hidden field humans never fill in; bots usually do
  @ApiPropertyOptional({ description: 'Leave empty (spam trap)' })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ enum: ['NEW', 'CONTACTED', 'CLOSED'] })
  @IsOptional()
  @IsIn(['NEW', 'CONTACTED', 'CLOSED'], {
    message: 'Use the convert endpoint to convert a lead',
  })
  status?: 'NEW' | 'CONTACTED' | 'CLOSED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// Either link an existing customer or create a new one
export class ConvertLeadDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Link this existing customer',
  })
  @ValidateIf((o: ConvertLeadDto) => !o.customer)
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    type: CreateCustomerDto,
    description: 'Create a new customer with these details',
  })
  @ValidateIf((o: ConvertLeadDto) => !o.customerId)
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;
}
