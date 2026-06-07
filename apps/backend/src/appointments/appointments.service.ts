import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async getDoctors(specialty?: string) {
    return this.prisma.doctor.findMany({
      where: {
        isAvailable: true,
        ...(specialty ? { specialty } : {}),
      },
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        specialty: true,
        bio: true,
        avatarUrl: true,
        rating: true,
        reviewCount: true,
        yearsExp: true,
        languages: true,
        consultFee: true,
      },
    });
  }

  async bookAppointment(
    userId: string,
    patientName: string,
    location: string,
    preferredTime: string,
    doctorId?: string,
    notes?: string,
    sessionType?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (doctorId) {
        // Prevent double booking race conditions
        const existing = await tx.appointment.findFirst({
          where: {
            doctorId,
            preferredTime,
            status: { not: 'CANCELLED' }
          }
        });
        if (existing) {
          throw new ForbiddenException('This time slot is already booked.');
        }
      }

      return tx.appointment.create({
        data: {
          userId,
          patientName,
          location,
          preferredTime,
          ...(doctorId ? { doctorId } : {}),
          ...(notes ? { notes } : {}),
          ...(sessionType ? { sessionType } : {}),
        },
        include: { doctor: { select: { name: true, specialty: true } } },
      });
    });
  }

  async getUserAppointments(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { doctor: { select: { name: true, specialty: true, avatarUrl: true } } },
    });
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    return this.prisma.appointment.updateMany({
      where: { id: appointmentId, userId },
      data: { status: 'CANCELLED' },
    });
  }

  async getDoctorAppointments(doctorId: string) {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async updateAppointmentStatus(appointmentId: string, status: string, doctorId: string) {
    return this.prisma.appointment.updateMany({
      where: { id: appointmentId, doctorId },
      data: { status },
    });
  }

  async getPatientDetails(userId: string, doctorId?: string) {
    if (doctorId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          userId,
          doctorId,
          status: 'CONFIRMED',
        },
      });
      if (!appointment) {
        throw new ForbiddenException('Access denied: You do not have an active appointment with this patient.');
      }
    }
    const [user, moods, journals, appointments, prescriptions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, gender: true, dob: true, profession: true },
      }),
      this.prisma.moodEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, content: true, summary: true, emotionTags: true, createdAt: true },
      }),
      this.prisma.appointment.findMany({
        where: { userId, doctorId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, notes: true, createdAt: true },
      }),
      this.prisma.prescription.findMany({
        where: { userId, doctorId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const clinicalNotes = appointments
      .filter((app) => app.notes)
      .map((app) => ({
        id: app.id,
        type: 'SOAP_NOTE',
        content: app.notes,
        createdAt: app.createdAt,
      }));

    return {
      profile: user,
      moodHistory: moods,
      recentJournals: journals,
      clinicalNotes,
      prescriptions,
    };
  }

  async addClinicalNoteByUser(userId: string, doctorId: string, note: string) {
    // Find the latest appointment for this user+doctor
    const latestAppointment = await this.prisma.appointment.findFirst({
      where: { userId, doctorId },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!latestAppointment) {
      throw new ForbiddenException('Cannot add note without an appointment.');
    }

    return this.prisma.appointment.update({
      where: { id: latestAppointment.id },
      data: { notes: latestAppointment.notes ? latestAppointment.notes + '\n\n---\n\n' + note : note },
    });
  }

  async addClinicalNote(appointmentId: string, doctorId: string, note: string) {
    return this.prisma.appointment.update({
      where: { id: appointmentId, doctorId },
      data: { notes: note },
    });
  }

  async createPrescription(userId: string, doctorId: string, fileUrl: string) {
    return this.prisma.prescription.create({
      data: {
        userId,
        doctorId,
        fileUrl,
        verified: true, // Auto-verify if created by a doctor
      },
    });
  }
}
