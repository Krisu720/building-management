import {
  CreateInspectionSchema,
  ErrorResponseSchema,
  InspectionListItemSchema,
  InspectionSchema,
  ROLES,
  type CreateInspection,
} from '@building-management/contracts';
import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles, Session, UserHasPermission, type UserSession } from '@thallesp/nestjs-better-auth';
import { InspectionsService } from './inspections.service.js';

@ApiTags('inspections')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Brak sesji' })
@ApiForbiddenResponse({ description: 'Brak uprawnień' })
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  @Roles([ROLES.ADMIN])
  @ApiOkResponse({ standardSchema: InspectionListItemSchema, isArray: true })
  findAll() {
    return this.inspectionsService.findAll();
  }

  @Get('mine')
  @UserHasPermission({ permission: { inspection: ['read'] } })
  @ApiOkResponse({ standardSchema: InspectionListItemSchema, isArray: true })
  findMine(@Session() session: UserSession) {
    return this.inspectionsService.findMine(session.user.id);
  }

  @Post()
  @UserHasPermission({ permission: { inspection: ['create'] } })
  @ApiCreatedResponse({ standardSchema: InspectionSchema, isArray: true })
  @ApiBadRequestResponse({ description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema })
  create(@Body({ schema: CreateInspectionSchema }) body: CreateInspection, @Session() session: UserSession) {
    return this.inspectionsService.create(body, session.user.id);
  }
}
