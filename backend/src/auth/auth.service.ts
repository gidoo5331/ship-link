import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateCompanyDto, SignInDto } from './dto';
import * as argon from 'argon2'
import { randomBytes } from 'crypto'
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService ) {}

    async createCompany(dto: CreateCompanyDto) {
        const subdomain = dto.subdomain ?? dto.company_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const tempPassword = randomBytes(4).toString('hex') // e.g. "a3f9bc12"
        const hash = await argon.hash(tempPassword)

        try {
            await this.prisma.company.create({
                data: {
                    name: dto.company_name,
                    subdomain,
                    email: dto.company_email,
                    phone: dto.company_phone,
                    users: {
                        create: {
                            firstName: dto.first_name,
                            lastName: dto.last_name,
                            email: dto.email,
                            phone: dto.phone,
                            password: hash,
                            systemRole: 'COMPANY_ADMIN',
                        },
                    },
                },
            })

            return { message: 'Registration submitted. Awaiting approval.' }
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                const fields: string[] = (error.meta as any)?.driverAdapterError?.cause?.constraint?.fields ?? []
                if (fields.includes('email')) throw new ConflictException('Email already in use')
                if (fields.includes('subdomain')) throw new ConflictException('Subdomain already taken')
                throw new ConflictException('A unique constraint was violated')
            }
            throw error
        }
    }


    async login(dto: SignInDto){
        // find user 
    const user = await this.prisma.user.findUnique({
      where:{
        email: dto.email
      }
    })

    // if user does not exist throw exception
    if (!user) throw new ForbiddenException("Credentials incorrect")
      
      // compare password
      const pwMatches = await argon.verify(user.password, dto.password) 
      
      // if password incorrect throw exception
      if (!pwMatches) throw new ForbiddenException("Credentials incorrect")

    // Send user and token
    const { password, ...safeUser } = user; // remove password from the returned user object

    const { access_token } = await this.signToken(user.id, user.email, user.systemRole);

    return { access_token, user: safeUser };
  }


async signToken(userId: string, email: string, systemRole: string ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email, systemRole };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret
    });
    return { access_token : token };
  }


}

