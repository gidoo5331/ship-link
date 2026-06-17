import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateCompanyDto, SignInDto } from './dto';
import { GetUser } from './decorator';
import type { User } from 'generated/prisma/client';
import { JwtAuthGuard } from './guard';
import { CompanyService } from 'src/company/company.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private companyService: CompanyService) {}

    @Post('register/company')
    createCompany(@Body() dto:CreateCompanyDto){
        return this.companyService.createCompany(dto)
    }

    @HttpCode(HttpStatus.OK)
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
