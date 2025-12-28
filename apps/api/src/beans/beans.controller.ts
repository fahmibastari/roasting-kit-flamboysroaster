import { Controller, Get, Param, Post, Body, Patch, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BeansService } from './beans.service';
import { CreateBeanDto } from './dto/create-bean.dto';

@Controller('beans') // URL-nya nanti: localhost:3000/beans
export class BeansController {
  constructor(private readonly beansService: BeansService) { }

  @Get()
  findAll() { return this.beansService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.beansService.findOne(id); }

  // Endpoint Tambah Kopi Baru
  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() body: any, // Form data comes as strings, so we map it manually or rely on transformation
    @UploadedFile() photo: Express.Multer.File
  ) {
    // Manual mapping to ensure numbers are numbers
    const dto: CreateBeanDto = {
      name: body.name,
      stockGB: Number(body.stockGB),
      stockRB: Number(body.stockRB),
      sackPhotoUrl: undefined // Will be set in service if photo exists
    };
    return this.beansService.create(dto, photo);
  }

  // Endpoint Restock (Patch)
  @Patch(':id/restock')
  @UseInterceptors(FileInterceptor('photo'))
  restock(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('type') type: 'GB' | 'RB' = 'GB', // Default to GB for backward compatibility
    @UploadedFile() photo: Express.Multer.File
  ) {
    return this.beansService.restock(id, Number(amount), type, photo);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBeanDto: any) {
    return this.beansService.update(id, updateBeanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.beansService.remove(id);
  }
}