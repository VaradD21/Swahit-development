import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('doctor')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  private checkDoctor(req: any) {
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctor access required');
    }
  }

  @Get('appointments')
  async getMyAppointments(@Request() req: any) {
    this.checkDoctor(req);
    return this.appointmentsService.getDoctorAppointments(req.user.userId || req.user.id);
  }

  @Get('patient/:id')
  async getPatientDetails(@Request() req: any, @Param('id') userId: string) {
    this.checkDoctor(req);
    // TODO: Verify that this patient has a valid appointment with this doctor
    return this.appointmentsService.getPatientDetails(userId);
  }

  @Post('notes')
  async addNote(@Request() req: any, @Body() body: { appointmentId: string; note: string }) {
    this.checkDoctor(req);
    return this.appointmentsService.addClinicalNote(
      body.appointmentId,
      req.user.userId || req.user.id,
      body.note,
    );
  }

  @Post('prescription')
  async addPrescription(
    @Request() req: any,
    @Body() body: { userId: string; fileUrl: string },
  ) {
    this.checkDoctor(req);
    return this.appointmentsService.createPrescription(
      body.userId,
      req.user.userId || req.user.id,
      body.fileUrl,
    );
  }
}
