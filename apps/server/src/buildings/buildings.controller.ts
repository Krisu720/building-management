import {
  BuildingIdSchema,
  BuildingSchema,
  BuildingWithApartmentsSchema,
  CreateBuildingSchema,
  ErrorResponseSchema,
  UpdateBuildingSchema,
  type CreateBuilding,
  type UpdateBuilding,
} from '@building-management/contracts';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Session, UserHasPermission, type UserSession } from '@thallesp/nestjs-better-auth';
import { BuildingsService } from './buildings.service.js';

const idParam = { schema: BuildingIdSchema };
const badRequest = { description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema };
const can = (action: 'create' | 'read' | 'update' | 'delete') =>
  UserHasPermission({ permission: { building: [action] } });

const notFound = { description: 'Budynek nie istnieje', standardSchema: ErrorResponseSchema };

@ApiTags('buildings')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Brak sesji' })
@ApiForbiddenResponse({ description: 'Brak uprawnień' })
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @can('read')
  @ApiOkResponse({ standardSchema: BuildingSchema, isArray: true })
  findAll() {
    return this.buildingsService.findAll();
  }

  @Get('with-apartments')
  @UserHasPermission({ permission: { building: ['read'], apartment: ['read'] } })
  @ApiOkResponse({ standardSchema: BuildingWithApartmentsSchema, isArray: true })
  findAllWithApartments() {
    return this.buildingsService.findAllWithApartments();
  }

  @Get(':id')
  @can('read')
  @ApiOkResponse({ standardSchema: BuildingSchema })
  @ApiBadRequestResponse(badRequest)
  @ApiNotFoundResponse(notFound)
  findOne(@Param('id', idParam) id: string) {
    return this.buildingsService.findOne(id);
  }

  @Post()
  @UserHasPermission({ permission: { building: ['create'], apartment: ['create'] } })
  @ApiCreatedResponse({ standardSchema: BuildingWithApartmentsSchema })
  @ApiBadRequestResponse(badRequest)
  create(
    @Body({ schema: CreateBuildingSchema }) body: CreateBuilding,
    @Session() session: UserSession,
  ) {
    return this.buildingsService.create(body, session.user.id);
  }

  @Patch(':id')
  @can('update')
  @ApiOkResponse({ standardSchema: BuildingSchema })
  @ApiBadRequestResponse(badRequest)
  @ApiNotFoundResponse(notFound)
  update(@Param('id', idParam) id: string, @Body({ schema: UpdateBuildingSchema }) body: UpdateBuilding) {
    return this.buildingsService.update(id, body);
  }

  @Delete(':id')
  @can('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiBadRequestResponse(badRequest)
  @ApiNotFoundResponse(notFound)
  remove(@Param('id', idParam) id: string) {
    return this.buildingsService.remove(id);
  }
}
