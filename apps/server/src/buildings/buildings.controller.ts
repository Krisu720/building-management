import { Controller, Get } from '@nestjs/common';
import { BuildingsService } from './buildings.service.js';

@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  findAll() {
    return this.buildingsService.findAll();
  }
}
