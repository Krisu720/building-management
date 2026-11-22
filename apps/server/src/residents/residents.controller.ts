import { ResidentListItemSchema, ROLES } from '@building-management/contracts';
import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ResidentsService } from './residents.service.js';

@ApiTags('residents')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Brak sesji' })
@ApiForbiddenResponse({ description: 'Brak uprawnień' })
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @Roles([ROLES.ADMIN])
  @ApiOkResponse({ standardSchema: ResidentListItemSchema, isArray: true })
  findAll() {
    return this.residentsService.findAll();
  }
}
