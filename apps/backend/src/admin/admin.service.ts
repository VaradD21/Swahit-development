import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async addTherapist(data: any) {
    // Check if email exists
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Create user and linked doctor profile in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.password,
          name: data.fullName,
          role: 'DOCTOR',
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          id: user.id, // Link doctor ID to user ID for easier reference
          name: data.fullName,
          specialty: data.specialty,
          bio: data.bio,
          yearsExp: parseInt(data.experienceYears) || 0,
          consultFee: parseFloat(data.fee) || 0,
          languages: data.languages,
          isAvailable: true,
        },
      });

      return doctor;
    });
  }

  async getTherapists(take: number = 20, skip: number = 0) {
    return this.prisma.doctor.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTherapistStatus(id: string, isAvailable: boolean) {
    return this.prisma.doctor.update({
      where: { id },
      data: { isAvailable }
    });
  }

  async getUsers(take: number = 20, skip: number = 0) {
    return this.prisma.user.findMany({
      take,
      skip,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        userSubscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAppointments(take: number = 20, skip: number = 0) {
    return this.prisma.appointment.findMany({
      take,
      skip,
      include: {
        user: { select: { name: true, email: true } },
        doctor: { select: { name: true, specialty: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAnalytics() {
    const [userCount, subCount, doctorCount, crisisAlerts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.userSubscription.count({ where: { status: 'active' } }),
      this.prisma.doctor.count(),
      this.prisma.notification.count({ where: { type: 'distress' } }),
    ]);

    // Simple revenue estimation from active subscriptions
    const activeSubs = await this.prisma.userSubscription.findMany({
      where: { status: 'active' },
      include: { plan: true },
    });
    const totalMonthlyRevenue = activeSubs.reduce((acc, sub) => acc + sub.plan.priceMonthly, 0);

    return {
      totalUsers: userCount,
      activeSubscriptions: subCount,
      totalDoctors: doctorCount,
      crisisAlerts,
      estimatedMonthlyRevenue: totalMonthlyRevenue,
    };
  }

  // Medicine System Management
  async getPrescriptions(take: number = 20, skip: number = 0) {
    return this.prisma.prescription.findMany({
      take,
      skip,
      include: {
        user: { select: { name: true, email: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyPrescription(id: string, verified: boolean) {
    return this.prisma.prescription.update({
      where: { id },
      data: { verified },
    });
  }

  async getMedicineOrders(take: number = 20, skip: number = 0) {
    return this.prisma.medicineOrder.findMany({
      take,
      skip,
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
