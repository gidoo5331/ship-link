import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateCompanyDto, SignInDto } from './dto';
import * as argon from 'argon2'
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientUnknownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, ) {}

    async createCompany(dto: CreateCompanyDto){
            console.log({"dto:": dto})
    try{
    // Generate subdomain from company name if not provided, ensuring it meets the required format
    const subdomain = dto.subdomain ?? dto.company_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        
    //   save new registed company in the database
    const company = await this.prisma.company.create({
        data: {
            name: dto.company_name,
            subdomain,
            email: dto.company_email,
            phone: dto.company_phone,
        }
    })

      // generate password hash
      const hash = await argon.hash(dto.password);
      
      // save company admin user in the database
      const user = await this.prisma.user.create({
        data: {
            firstName: dto.first_name,
            lastName: dto.last_name,
            email: dto.email,
            password: hash,
            systemRole: 'COMPANY_ADMIN',
          }
    }) 
    const { password, ...userWithoutPassword } = user; // remove password from the returned user object
    return { company, user: userWithoutPassword }
    // return new saved user 
//   return this.signToken(user.id, user.email);
        }catch (error){
          if (error instanceof PrismaClientUnknownRequestError){
            // if (error.code === 'P2002'){
            //   throw new ForbiddenException(
            //     'Email already in use'
            //   )
            // }
          }
          throw error
        }
    }


    async login(dto: SignInDto){
        return 'login'
    }
}
