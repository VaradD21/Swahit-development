import { Controller, Post, Body, UseGuards, Get, Patch, Param, Query, ParseBoolPipe } from '@nestjs/common';
import { AddTherapistDto } from './dto/add-therapist.dto';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('therapists')
  async addTherapist(@Body() body: AddTherapistDto) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);
    return this.adminService.addTherapist({
      ...body,
      password: hashedPassword,
    });
  }

  @Get('therapists')
  async getTherapists(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = Math.min(take ? parseInt(take, 10) : 20, 100);
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.adminService.getTherapists(limit, offset);
  }

  @Patch('therapists/:id/status')
  async toggleTherapistStatus(
    @Param('id') id: string, 
    @Body('isAvailable', ParseBoolPipe) isAvailable: boolean
  ) {
    return this.adminService.updateTherapistStatus(id, isAvailable);
  }

  @Get('users')
  async getUsers(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = Math.min(take ? parseInt(take, 10) : 20, 100);
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.adminService.getUsers(limit, offset);
  }

  @Get('appointments')
  async getAppointments(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = Math.min(take ? parseInt(take, 10) : 20, 100);
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.adminService.getAppointments(limit, offset);
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('medicine/prescriptions')
  async getPrescriptions(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = Math.min(take ? parseInt(take, 10) : 20, 100);
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.adminService.getPrescriptions(limit, offset);
  }

  @Patch('medicine/prescriptions/:id/verify')
  async verifyPrescription(
    @Param('id') id: string,
    @Body('verified', ParseBoolPipe) verified: boolean,
  ) {
    return this.adminService.verifyPrescription(id, verified);
  }

  @Get('medicine/orders')
  async getMedicineOrders(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = Math.min(take ? parseInt(take, 10) : 20, 100);
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.adminService.getMedicineOrders(limit, offset);
  }
}
