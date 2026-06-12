import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateCompanyDto, SignInDto } from './dto';

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
}
