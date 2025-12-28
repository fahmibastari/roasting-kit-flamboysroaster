// apps/api/src/users/users.controller.ts
import { Controller, Get, Post, Body, UnauthorizedException, Request, UseGuards, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly authService: AuthService) { }

  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Endpoint Khusus Login
  @Public() // <--- Boleh diakses tanpa token
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) throw new UnauthorizedException('Username atau Password salah');
    return this.authService.login(user);
  }
}