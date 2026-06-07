import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        dob: true,
        phone: true,
        gender: true,
        profession: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: import('./dto/create-user.dto').CreateUserDto) {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword || '',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
