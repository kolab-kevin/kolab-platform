import type { AccessTokenPayload } from '@kolab/auth';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  type PresignDownloadRequest,
  PresignDownloadRequestSchema,
  type PresignUploadRequest,
  PresignUploadRequestSchema,
} from './storage.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth('access-token')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign-upload')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a presigned upload URL for creator document storage' })
  @ApiResponse({ status: 201, description: 'Presigned upload URL generated' })
  presignUpload(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(PresignUploadRequestSchema)) body: PresignUploadRequest,
  ) {
    return this.storageService.presignUpload(user, body);
  }

  @Post('presign-download')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Create a presigned download URL for creator document storage' })
  @ApiResponse({ status: 200, description: 'Presigned download URL generated' })
  presignDownload(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(PresignDownloadRequestSchema)) body: PresignDownloadRequest,
  ) {
    return this.storageService.presignDownload(user, body);
  }
}
