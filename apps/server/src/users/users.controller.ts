import {
  ErrorResponseSchema,
  ListUsersQuerySchema,
  ROLES,
  UserSummarySchema,
  type ListUsersQuery,
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
import { Roles } from '@thallesp/nestjs-better-auth';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Brak sesji' })
@ApiForbiddenResponse({ description: 'Brak uprawnień' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles([ROLES.ADMIN])
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filtr po roli użytkownika',
    schema: { type: 'string', enum: [ROLES.ADMIN, ROLES.USER, ROLES.TECHNICIAN] },
  })
  @ApiOkResponse({ standardSchema: UserSummarySchema, isArray: true })
  @ApiBadRequestResponse({ description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema })
  findAll(@Query({ schema: ListUsersQuerySchema }) query: ListUsersQuery) {
    return this.usersService.findAll(query);
  }
}
