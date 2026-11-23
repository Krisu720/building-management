import {
  CreateIssueSchema,
  ErrorResponseSchema,
  IssueListItemSchema,
  IssueSchema,
  ListIssuesQuerySchema,
  ROLES,
  type CreateIssue,
  type ListIssuesQuery,
} from '@building-management/contracts';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles, Session, UserHasPermission, type UserSession } from '@thallesp/nestjs-better-auth';
import { IssuesService } from './issues.service.js';

@ApiTags('issues')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Brak sesji' })
@ApiForbiddenResponse({ description: 'Brak uprawnień' })
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @Roles([ROLES.ADMIN])
  @ApiQuery({
    name: 'number',
    required: false,
    description: 'Filtr po numerze zgłoszenia (np. 1001 lub #1001)',
    schema: { type: 'string', pattern: '^#?\\d+$' },
  })
  @ApiOkResponse({ standardSchema: IssueListItemSchema, isArray: true })
  @ApiBadRequestResponse({ description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema })
  findAll(@Query({ schema: ListIssuesQuerySchema }) query: ListIssuesQuery) {
    return this.issuesService.findAll(query);
  }

  @Get('mine')
  @UserHasPermission({ permission: { issue: ['read'] } })
  @ApiOkResponse({ standardSchema: IssueListItemSchema, isArray: true })
  findMine(@Session() session: UserSession) {
    return this.issuesService.findByReporter(session.user.id);
  }

  @Post()
  @UserHasPermission({ permission: { issue: ['create'] } })
  @ApiCreatedResponse({ standardSchema: IssueSchema })
  @ApiBadRequestResponse({ description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema })
  create(@Body({ schema: CreateIssueSchema }) body: CreateIssue, @Session() session: UserSession) {
    return this.issuesService.create(body, session.user.id);
  }
}
