import { Module } from '@nestjs/common';
import { BeansService } from './beans.service';
import { BeansController } from './beans.controller';

@Module({
  controllers: [BeansController],
  providers: [BeansService],
})
export class BeansModule {}
