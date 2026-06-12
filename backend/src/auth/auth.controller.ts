import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateCompanyDto, SignInDto } from './dto';
import { GetUser } from './decorator';
import type { User } from 'generated/prisma/client';
import { JwtAuthGuard } from './guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register/company')
    createCompany(@Body() dto:CreateCompanyDto){
        return this.authService.createCompany(dto)
    }

    @Post('login')
    login(@Body() dto:SignInDto){
        return this.authService.login(dto)
    }

     @Get('me')
     @UseGuards(JwtAuthGuard)
      getMe(@GetUser() user: User) {
        return  user;
      }
    
}
