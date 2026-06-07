import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DOCTOR')
export class DoctorController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('appointments')
  async getMyAppointments(@Request() req: any) {
    return this.appointmentsService.getDoctorAppointments(req.user.userId || req.user.id);
  }

  @Get('patient/:id')
  async getPatientDetails(@Request() req: any, @Param('id') userId: string) {
    return this.appointmentsService.getPatientDetails(userId, req.user.userId || req.user.id);
  }

  @Post('notes')
  async addNote(@Request() req: any, @Body() body: { appointmentId: string; note: string }) {
    return this.appointmentsService.addClinicalNote(
      body.appointmentId,
      req.user.userId || req.user.id,
      body.note,
    );
  }

  @Post('clinical-notes')
  async addClinicalNoteByUser(@Request() req: any, @Body() body: { userId: string; content: string; type?: string }) {
    return this.appointmentsService.addClinicalNoteByUser(
      body.userId,
      req.user.userId || req.user.id,
      body.content,
    );
  }

  @Post('prescription')
  async addPrescription(
    @Request() req: any,
    @Body() body: { userId: string; fileUrl: string },
  ) {
    return this.appointmentsService.createPrescription(
      body.userId,
      req.user.userId || req.user.id,
      body.fileUrl,
    );
  }
}
