import {
  CreateIssueSchema,
  ErrorResponseSchema,
  IssueSchema,
  type CreateIssue,
} from '@building-management/contracts';
import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Session, UserHasPermission, type UserSession } from '@thallesp/nestjs-better-auth';
import { IssuesService } from './issues.service.js';

@ApiTags('issues')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Brak sesji' })
@ApiForbiddenResponse({ description: 'Brak uprawnień' })
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @UserHasPermission({ permission: { issue: ['create'] } })
  @ApiCreatedResponse({ standardSchema: IssueSchema })
  @ApiBadRequestResponse({ description: 'Niepoprawne dane wejściowe', standardSchema: ErrorResponseSchema })
  create(@Body({ schema: CreateIssueSchema }) body: CreateIssue, @Session() session: UserSession) {
    return this.issuesService.create(body, session.user.id);
  }
}
