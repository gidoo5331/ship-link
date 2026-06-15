import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { PassportStrategy } from "@nestjs/passport";
import { CompanyStatus } from "generated/prisma/enums";
import { Strategy, ExtractJwt } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET') || '',
    });
  }

  async validate(payload: {sub:string ; email: string }) {
    const user = await this.prisma.user.findUnique({
        where: {
            id: payload.sub
        }
    })
    if (!user || !user.isActive) {
    throw new UnauthorizedException('Account is deactivated');
  }

  if (user.companyId) {
  // const company = await this.companiesService.findById(user.companyId);
  // if (company.status !== CompanyStatus.APPROVED) {
  //   throw new UnauthorizedException('Company account is not active');
  // }
}
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}