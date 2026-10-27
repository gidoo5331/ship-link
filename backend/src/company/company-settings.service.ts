import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import {
  CreateLogoUploadDto,
  UpdateCompanySettingsDto,
} from './dto/update-company-settings.dto';

const settingsSelect = {
  id: true,
  name: true,
  subdomain: true,
  status: true,
  email: true,
  phone: true,
  whatsapp: true,
  address: true,
  logoUrl: true,
  tagline: true,
  heroHeading: true,
  heroSubheading: true,
  about: true,
  rentalsEnabled: true,
} as const;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// The company's own profile and public-website content, edited by its team.
@Injectable()
export class CompanySettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getSettings(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: settingsSelect,
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateSettings(companyId: string, dto: UpdateCompanySettingsDto) {
    const current = await this.getSettings(companyId);

    // "" clears an optional field
    const text = (value: string | undefined) =>
      value === undefined
        ? undefined
        : value.trim() === ''
          ? null
          : value.trim();

    let logoUrl: string | null | undefined;
    if (dto.logoUrl !== undefined) {
      logoUrl = dto.logoUrl ? dto.logoUrl : null;
      if (
        logoUrl &&
        !this.storage
          .keyFromPublicUrl(logoUrl)
          ?.startsWith(this.logoPrefix(companyId))
      ) {
        throw new BadRequestException(
          'Logo must be uploaded through the logo upload endpoint',
        );
      }
    }

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        email: text(dto.email),
        phone: text(dto.phone),
        whatsapp: text(dto.whatsapp),
        address: text(dto.address),
        tagline: text(dto.tagline),
        heroHeading: text(dto.heroHeading),
        heroSubheading: text(dto.heroSubheading),
        about: text(dto.about),
        ...(dto.rentalsEnabled !== undefined && {
          rentalsEnabled: dto.rentalsEnabled,
        }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
      select: settingsSelect,
    });

    // remove the replaced logo from storage
    if (
      logoUrl !== undefined &&
      current.logoUrl &&
      current.logoUrl !== logoUrl
    ) {
      const oldKey = this.storage.keyFromPublicUrl(current.logoUrl);
      if (oldKey?.startsWith(this.logoPrefix(companyId)))
        await this.storage.deleteMany([oldKey]);
    }

    return updated;
  }

  // the client uploads, then PATCHes settings with the returned `url` as logoUrl
  async createLogoUpload(companyId: string, dto: CreateLogoUploadDto) {
    await this.getSettings(companyId);
    const key = `${this.logoPrefix(companyId)}${randomUUID()}.${EXTENSIONS[dto.contentType]}`;
    return this.storage.createUploadUrl(key, dto.contentType, dto.size);
  }

  private logoPrefix(companyId: string) {
    return `companies/${companyId}/logo/`;
  }
}
