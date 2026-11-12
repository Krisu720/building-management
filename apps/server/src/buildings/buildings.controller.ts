import {
  BuildingIdSchema,
  BuildingSchema,
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
  ApiTags,
} from '@nestjs/swagger';
import { BuildingsService } from './buildings.service.js';

const idParam = { schema: BuildingIdSchema };
const badRequest = { description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema };
const notFound = { description: 'Budynek nie istnieje', standardSchema: ErrorResponseSchema };

@ApiTags('buildings')
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @ApiOkResponse({ standardSchema: BuildingSchema, isArray: true })
  findAll() {
    return this.buildingsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ standardSchema: BuildingSchema })
  @ApiBadRequestResponse(badRequest)
  @ApiNotFoundResponse(notFound)
  findOne(@Param('id', idParam) id: string) {
    return this.buildingsService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ standardSchema: BuildingSchema })
  @ApiBadRequestResponse(badRequest)
  create(@Body({ schema: CreateBuildingSchema }) body: CreateBuilding) {
    return this.buildingsService.create(body);
  }

  @Patch(':id')
  @ApiOkResponse({ standardSchema: BuildingSchema })
  @ApiBadRequestResponse(badRequest)
  @ApiNotFoundResponse(notFound)
  update(@Param('id', idParam) id: string, @Body({ schema: UpdateBuildingSchema }) body: UpdateBuilding) {
    return this.buildingsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiBadRequestResponse(badRequest)
  @ApiNotFoundResponse(notFound)
  remove(@Param('id', idParam) id: string) {
    return this.buildingsService.remove(id);
  }
}
