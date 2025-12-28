import { Test, TestingModule } from '@nestjs/testing';
import { RoastingService } from './roasting.service';

describe('RoastingService', () => {
  let service: RoastingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoastingService],
    }).compile();

    service = module.get<RoastingService>(RoastingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
