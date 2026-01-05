// apps/api/src/roasting/roasting.controller.ts
import { Controller, Post, Body, Param, Patch, UseInterceptors, UploadedFile, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoastingService } from './roasting.service';
import { CreateRoastingDto } from './dto/create-roasting.dto';
import { CreateLogDto } from './dto/create-log.dto';

@Controller('roasting')
export class RoastingController {
  constructor(private readonly roastingService: RoastingService) { }

  // --- TAMBAHKAN BAGIAN INI (YANG HILANG) ---
  @Get()
  findAll() {
    return this.roastingService.findAll();
  }
  // -------------------------------------------

  @Get('state/inprogress/:roasterId')
  findInProgress(@Param('roasterId') roasterId: string) {
    return this.roastingService.findInProgress(roasterId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roastingService.findOne(id);
  }

  // ... sisa method Post & Patch biarkan saja ...
  @Post()
  create(@Body() createRoastingDto: CreateRoastingDto) {
    return this.roastingService.create(createRoastingDto);
  }

  @Post(':id/log')
  addLog(@Param('id') id: string, @Body() createLogDto: CreateLogDto) {
    return this.roastingService.addLog(id, createLogDto);
  }

  @Patch(':id/finish')
  @UseInterceptors(FileInterceptor('photo'))
  async finish(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    // Manual extraction to ensure multipart fields are caught
    const finalTime = body.finalTime;
    const finalTemp = body.finalTemp;

    console.log("Controller Finish:", { id, finalTime, finalTemp, hasPhoto: !!photo });

    if (!finalTime || !finalTemp) {
      // Fallback or Error? throw error to alert mobile app
      // But wait, mobile app might have sent it. 
      // If undefined here, it means parsing failed.
    }

    return this.roastingService.finishRoasting(
      id,
      finalTime,
      parseInt(finalTemp),
      photo
    );
  }

  // Endpoint Baru: Input QC (PATCH)
  @Patch(':id/qc')
  updateQC(
    @Param('id') id: string,
    @Body('score') score: number,
    @Body('notes') notes: string,
    @Body('isApproved') isApproved: boolean
  ) {
    return this.roastingService.updateQC(id, Number(score), notes, isApproved);
  }
}