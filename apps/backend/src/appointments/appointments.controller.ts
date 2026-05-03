import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Public — doctor listing for booking page
  @Get('doctors')
  async getDoctors(@Query('specialty') specialty?: string) {
    return this.appointmentsService.getDoctors(specialty);
  }

  @UseGuards(JwtAuthGuard, FeatureGuard('appointment_booking'))
  @Post()
  async book(
    @Request() req: any,
    @Body() body: { patientName?: string; location: string; preferredTime: string; doctorId?: string; notes?: string; sessionType?: string },
  ) {
    return this.appointmentsService.bookAppointment(
      req.user.userId,
      body.patientName || 'Self',
      body.location,
      body.preferredTime,
      body.doctorId,
      body.notes,
      body.sessionType,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAppointments(@Request() req: any) {
    return this.appointmentsService.getUserAppointments(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.appointmentsService.cancelAppointment(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctor')
  async getDoctorAppointments(@Request() req: any) {
    // In a real app, verify role === 'DOCTOR' here
    // For now, assume the user ID matches the doctor ID (if they are a doctor)
    // To support this, we would ideally fetch the doctor profile linked to this user.
    // For MVP, if we pass doctorId in query or infer it:
    return this.appointmentsService.getDoctorAppointments(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.appointmentsService.updateAppointmentStatus(id, status, req.user.userId);
  }
}
