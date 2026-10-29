import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

const optionalText = (value: unknown) =>
  value !== undefined && value !== '' && value !== null;

export class CreateCustomerDto {
  @ApiProperty({ example: 'Akosua' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName!: string;

  @ApiProperty({ example: 'Boateng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName!: string;

  @ApiProperty({ example: '024 555 0133' })
  @IsString()
  @Matches(/(\d.*){9,}/, {
    message: 'Enter a phone number with at least 9 digits',
  })
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ example: 'akosua@example.com' })
  @ValidateIf((o: CreateCustomerDto) => optionalText(o.email))
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'GHA-000000000-0' })
  @ValidateIf((o: CreateCustomerDto) => optionalText(o.ghanaCardNumber))
  @IsString()
  @MaxLength(20)
  ghanaCardNumber?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateCustomerDto) => optionalText(o.address))
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: 'Kumasi' })
  @ValidateIf((o: CreateCustomerDto) => optionalText(o.city))
  @IsString()
  @MaxLength(60)
  city?: string;

  @ApiPropertyOptional({ example: 'Ashanti' })
  @ValidateIf((o: CreateCustomerDto) => optionalText(o.region))
  @IsString()
  @MaxLength(60)
  region?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateCustomerDto) => optionalText(o.notes))
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Create even if another customer has the same phone number',
  })
  @IsOptional()
  @IsBoolean()
  allowDuplicatePhone?: boolean;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
