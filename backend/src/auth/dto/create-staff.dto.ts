import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
    @IsEmail()
    @IsNotEmpty()
    email!: string

    @IsString()
    @MinLength(4)
    @IsNotEmpty()
    password!: string
}