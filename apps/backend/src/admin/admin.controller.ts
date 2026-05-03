import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Post('therapists')
  async addTherapist(@Request() req: any, @Body() body: any) {
    this.checkAdmin(req);
    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);
    return this.adminService.addTherapist({
      ...body,
      password: hashedPassword,
    });
  }

  @Get('therapists')
  async getTherapists(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getTherapists();
  }

  @Patch('therapists/:id/status')
  async toggleTherapistStatus(
    @Request() req: any, 
    @Param('id') id: string, 
    @Body('isAvailable') isAvailable: boolean
  ) {
    this.checkAdmin(req);
    return this.adminService.updateTherapistStatus(id, isAvailable);
  }

  @Get('users')
  async getUsers(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getUsers();
  }

  @Get('appointments')
  async getAppointments(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAppointments();
  }

  @Get('analytics')
  async getAnalytics(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAnalytics();
  }

  @Get('medicine/prescriptions')
  async getPrescriptions(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getPrescriptions();
  }

  @Patch('medicine/prescriptions/:id/verify')
  async verifyPrescription(
    @Request() req: any,
    @Param('id') id: string,
    @Body('verified') verified: boolean,
  ) {
    this.checkAdmin(req);
    return this.adminService.verifyPrescription(id, verified);
  }

  @Get('medicine/orders')
  async getMedicineOrders(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getMedicineOrders();
  }
}
