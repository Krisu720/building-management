import {
  CreateIssueSchema,
  ErrorResponseSchema,
  IssueListItemSchema,
  IssueSchema,
  ROLES,
  type CreateIssue,
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
  @ApiOkResponse({ standardSchema: IssueListItemSchema, isArray: true })
  findAll() {
    return this.issuesService.findAll();
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
