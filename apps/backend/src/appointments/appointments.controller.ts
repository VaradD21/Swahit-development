import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('doctors')
  async getDoctors(@Query('specialty') specialty?: string) {
    return this.appointmentsService.getDoctors(specialty);
  }

  @UseGuards(FeatureGuard('appointment_booking'))
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

  @Get()
  async getAppointments(@Request() req: any) {
    return this.appointmentsService.getUserAppointments(req.user.userId);
  }

  @Delete(':id')
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.appointmentsService.cancelAppointment(req.user.userId, id);
  }

  @UseGuards(RolesGuard)
  @Roles('DOCTOR')
  @Get('doctor')
  async getDoctorAppointments(@Request() req: any) {
    return this.appointmentsService.getDoctorAppointments(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('DOCTOR')
  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.appointmentsService.updateAppointmentStatus(id, status, req.user.userId);
  }
}
