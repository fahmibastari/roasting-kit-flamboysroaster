import { PartialType } from '@nestjs/mapped-types';
import { CreateRoastingDto } from './create-roasting.dto';

export class UpdateRoastingDto extends PartialType(CreateRoastingDto) {}
