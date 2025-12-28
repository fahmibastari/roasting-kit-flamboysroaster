import { Test, TestingModule } from '@nestjs/testing';
import { RoastingController } from './roasting.controller';
import { RoastingService } from './roasting.service';

describe('RoastingController', () => {
  let controller: RoastingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoastingController],
      providers: [RoastingService],
    }).compile();

    controller = module.get<RoastingController>(RoastingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
