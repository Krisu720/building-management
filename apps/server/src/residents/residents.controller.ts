import {
  AssignResidentApartmentSchema,
  ErrorResponseSchema,
  ResidentIdSchema,
  ResidentListItemSchema,
  ROLES,
  type AssignResidentApartment,
} from '@building-management/contracts';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
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

  @Patch(':id/apartment')
  @Roles([ROLES.ADMIN])
  @ApiOkResponse({ standardSchema: ResidentListItemSchema })
  @ApiBadRequestResponse({ description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema })
  @ApiNotFoundResponse({ description: 'Mieszkaniec nie istnieje', standardSchema: ErrorResponseSchema })
  assignApartment(
    @Param('id', { schema: ResidentIdSchema }) id: string,
    @Body({ schema: AssignResidentApartmentSchema }) body: AssignResidentApartment,
  ) {
    return this.residentsService.assignApartment(id, body.apartmentId);
  }
}
