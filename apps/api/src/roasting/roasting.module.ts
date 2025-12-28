import { Module } from '@nestjs/common';
import { RoastingService } from './roasting.service';
import { RoastingController } from './roasting.controller';

@Module({
  controllers: [RoastingController],
  providers: [RoastingService],
})
export class RoastingModule {}
