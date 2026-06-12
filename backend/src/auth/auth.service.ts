import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCompanyDto, SignInDto } from './dto';
import * as argon from 'argon2'
import { randomBytes } from 'crypto'
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, ) {}

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
        return 'login'
    }
}
