import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreateCreatorDocumentInput,
  CreateCreatorDocumentVersionInput,
  DownloadCreatorDocumentInput,
  ReviewCreatorDocumentInput,
  UpdateCreatorDocumentInput,
} from '@kolab/types';
import {
  CreateCreatorDocumentSchema,
  CreateCreatorDocumentVersionSchema,
  DownloadCreatorDocumentSchema,
  ReviewCreatorDocumentSchema,
  UpdateCreatorDocumentSchema,
} from '@kolab/types';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatorsDocumentsService } from './creators-documents.service';

@ApiTags('creators')
@ApiBearerAuth('access-token')
@Controller('creators')
export class CreatorsDocumentsController {
  constructor(private readonly creatorsDocumentsService: CreatorsDocumentsService) {}

  @Get(':creatorId/documents')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List documents for a creator' })
  @ApiResponse({ status: 200, description: 'Creator documents list' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  listDocuments(@CurrentUser() user: AccessTokenPayload, @Param('creatorId') creatorId: string) {
    return this.creatorsDocumentsService.listDocuments(user, creatorId);
  }

  @Get(':creatorId/documents/:documentId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get creator document detail with versions' })
  @ApiResponse({ status: 200, description: 'Creator document detail' })
  @ApiResponse({ status: 404, description: 'Creator or document not found' })
  getDocument(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.creatorsDocumentsService.getDocument(user, creatorId, documentId);
  }

  @Post(':creatorId/documents')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a creator document record' })
  @ApiResponse({ status: 201, description: 'Creator document created' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  createDocument(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Body(new ZodValidationPipe(CreateCreatorDocumentSchema)) body: CreateCreatorDocumentInput,
  ) {
    return this.creatorsDocumentsService.createDocument(user, creatorId, body);
  }

  @Patch(':creatorId/documents/:documentId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator document metadata' })
  @ApiResponse({ status: 200, description: 'Creator document updated' })
  @ApiResponse({ status: 404, description: 'Creator or document not found' })
  updateDocument(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('documentId') documentId: string,
    @Body(new ZodValidationPipe(UpdateCreatorDocumentSchema)) body: UpdateCreatorDocumentInput,
  ) {
    return this.creatorsDocumentsService.updateDocument(user, creatorId, documentId, body);
  }

  @Post(':creatorId/documents/:documentId/versions')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Register an uploaded document version' })
  @ApiResponse({ status: 201, description: 'Document version added' })
  @ApiResponse({ status: 404, description: 'Creator or document not found' })
  addDocumentVersion(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('documentId') documentId: string,
    @Body(new ZodValidationPipe(CreateCreatorDocumentVersionSchema))
    body: CreateCreatorDocumentVersionInput,
  ) {
    return this.creatorsDocumentsService.addDocumentVersion(user, creatorId, documentId, body);
  }

  @Post(':creatorId/documents/:documentId/review')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Review a creator document' })
  @ApiResponse({ status: 200, description: 'Creator document reviewed' })
  @ApiResponse({ status: 404, description: 'Creator or document not found' })
  reviewDocument(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('documentId') documentId: string,
    @Body(new ZodValidationPipe(ReviewCreatorDocumentSchema)) body: ReviewCreatorDocumentInput,
  ) {
    return this.creatorsDocumentsService.reviewDocument(user, creatorId, documentId, body);
  }

  @Post(':creatorId/documents/:documentId/download')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Create a presigned download URL for a document version' })
  @ApiResponse({ status: 200, description: 'Presigned download URL generated' })
  @ApiResponse({ status: 404, description: 'Creator or document not found' })
  downloadDocument(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('documentId') documentId: string,
    @Body(new ZodValidationPipe(DownloadCreatorDocumentSchema))
    body: DownloadCreatorDocumentInput,
  ) {
    return this.creatorsDocumentsService.downloadDocument(user, creatorId, documentId, body);
  }
}
