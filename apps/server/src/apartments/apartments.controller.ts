import {
  ApartmentSchema,
  ErrorResponseSchema,
  ListApartmentsQuerySchema,
  type ListApartmentsQuery,
} from '@building-management/contracts';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApartmentsService } from './apartments.service.js';

@ApiTags('apartments')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Brak sesji' })
@ApiForbiddenResponse({ description: 'Brak uprawnień' })
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly apartmentsService: ApartmentsService) {}

  @Get()
  @UserHasPermission({ permission: { apartment: ['read'] } })
  @ApiQuery({ name: 'buildingId', required: false, description: 'Filtr po budynku (uuid)', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ standardSchema: ApartmentSchema, isArray: true })
  @ApiBadRequestResponse({ description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema })
  findAll(@Query({ schema: ListApartmentsQuerySchema }) query: ListApartmentsQuery) {
    return this.apartmentsService.findAll(query);
  }
}
