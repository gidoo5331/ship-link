import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Optional text fields accept "" to clear them.
const optionalText = (value: unknown) => value !== undefined && value !== '';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ example: 'GH Motors' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'info@ghmotors.com' })
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.email))
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+233 24 000 0000' })
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.phone))
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: '233240000000',
    description: 'Country code + number, digits only',
  })
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.whatsapp))
  @Matches(/^\d{8,15}$/, {
    message:
      'WhatsApp number must be digits only, with the country code (e.g. 233240000000)',
  })
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'Tema Port Road, Tema' })
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.address))
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: 'Quality foreign-used cars, delivered' })
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.tagline))
  @IsString()
  @MaxLength(120)
  tagline?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.heroHeading))
  @IsString()
  @MaxLength(120)
  heroHeading?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.heroSubheading))
  @IsString()
  @MaxLength(300)
  heroSubheading?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: UpdateCompanySettingsDto) => optionalText(o.about))
  @IsString()
  @MaxLength(2000)
  about?: string;

  @ApiPropertyOptional({
    description: 'Offer products for rent as well as for sale',
  })
  @IsOptional()
  @IsBoolean()
  rentalsEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'URL returned by the logo upload-url endpoint, or "" / null to remove the logo',
  })
  @ValidateIf(
    (o: UpdateCompanySettingsDto) =>
      optionalText(o.logoUrl) && o.logoUrl !== null,
  )
  @IsString()
  logoUrl?: string | null;
}

export const LOGO_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export class CreateLogoUploadDto {
  @ApiProperty({ enum: LOGO_CONTENT_TYPES })
  @IsIn(LOGO_CONTENT_TYPES)
  contentType!: (typeof LOGO_CONTENT_TYPES)[number];

  @ApiProperty({ description: 'File size in bytes (max 2 MB)' })
  @IsInt()
  @Min(1)
  @Max(2 * 1024 * 1024)
  size!: number;
}
