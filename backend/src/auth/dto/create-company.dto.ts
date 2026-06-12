import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  company_name!: string

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'subdomain can only contain lowercase letters, numbers, and hyphens' })
  subdomain?: string

  @IsOptional()
  @IsEmail()
  company_email?: string

  @IsOptional()
  @IsPhoneNumber()
  company_phone?: string

  @IsString()
  @IsNotEmpty()
  first_name!: string

  @IsString()
  @IsNotEmpty()
  last_name!: string

  @IsEmail()
  @IsNotEmpty()
  email!: string

  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string
}
