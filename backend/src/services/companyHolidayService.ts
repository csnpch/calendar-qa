import { PrismaClient } from '@prisma/client';

export interface CompanyHoliday {
  id: number;
  name: string;
  date: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyHolidayInput {
  name: string;
  date: string;
  description?: string;
}

export interface UpdateCompanyHolidayInput {
  name?: string;
  date?: string;
  description?: string;
}

export class CompanyHolidayService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllCompanyHolidays(): Promise<CompanyHoliday[]> {
    return await this.prisma.companyHoliday.findMany({
      orderBy: { date: 'asc' }
    });
  }

  async getCompanyHolidaysByYear(year: number): Promise<CompanyHoliday[]> {
    return await this.prisma.companyHoliday.findMany({
      where: {
        date: {
          startsWith: year.toString()
        }
      },
      orderBy: { date: 'asc' }
    });
  }

  async getCompanyHolidayById(id: number): Promise<CompanyHoliday | null> {
    return await this.prisma.companyHoliday.findUnique({
      where: { id }
    });
  }

  async createCompanyHoliday(data: CreateCompanyHolidayInput): Promise<CompanyHoliday> {
    return await this.prisma.companyHoliday.create({
      data
    });
  }

  async createMultipleCompanyHolidays(holidays: CreateCompanyHolidayInput[]): Promise<CompanyHoliday[]> {
    const results = await Promise.all(
      holidays.map(holiday => this.prisma.companyHoliday.create({ data: holiday }))
    );
    return results;
  }

  async updateCompanyHoliday(id: number, data: UpdateCompanyHolidayInput): Promise<CompanyHoliday> {
    return await this.prisma.companyHoliday.update({
      where: { id },
      data
    });
  }

  async deleteCompanyHoliday(id: number): Promise<CompanyHoliday> {
    return await this.prisma.companyHoliday.delete({
      where: { id }
    });
  }

  async isCompanyHoliday(date: string): Promise<boolean> {
    const holiday = await this.prisma.companyHoliday.findFirst({
      where: { date }
    });
    return !!holiday;
  }

  async getCompanyHolidaysForDateRange(startDate: string, endDate: string): Promise<CompanyHoliday[]> {
    return await this.prisma.companyHoliday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
  }

  async deleteAllCompanyHolidays(): Promise<{ count: number }> {
    const result = await this.prisma.companyHoliday.deleteMany({});
    return { count: result.count };
  }
}