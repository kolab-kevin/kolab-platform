import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreateCreatorContractInput,
  CreateCreatorContractVersionInput,
  DownloadCreatorContractInput,
  UpdateCreatorContractInput,
  UpdateCreatorContractStatusInput,
} from '@kolab/types';
import {
  CreateCreatorContractSchema,
  CreateCreatorContractVersionSchema,
  DownloadCreatorContractSchema,
  UpdateCreatorContractSchema,
  UpdateCreatorContractStatusSchema,
} from '@kolab/types';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatorsContractsService } from './creators-contracts.service';

@ApiTags('creators')
@ApiBearerAuth('access-token')
@Controller('creators')
export class CreatorsContractsController {
  constructor(private readonly creatorsContractsService: CreatorsContractsService) {}

  @Get(':creatorId/contracts')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List contracts for a creator' })
  @ApiResponse({ status: 200, description: 'Creator contracts list' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  listContracts(@CurrentUser() user: AccessTokenPayload, @Param('creatorId') creatorId: string) {
    return this.creatorsContractsService.listContracts(user, creatorId);
  }

  @Get(':creatorId/contracts/:contractId')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Get creator contract detail with versions' })
  @ApiResponse({ status: 200, description: 'Creator contract detail' })
  @ApiResponse({ status: 404, description: 'Creator or contract not found' })
  getContract(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('contractId') contractId: string,
  ) {
    return this.creatorsContractsService.getContract(user, creatorId, contractId);
  }

  @Post(':creatorId/contracts')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Create a creator contract record' })
  @ApiResponse({ status: 201, description: 'Creator contract created' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  createContract(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Body(new ZodValidationPipe(CreateCreatorContractSchema)) body: CreateCreatorContractInput,
  ) {
    return this.creatorsContractsService.createContract(user, creatorId, body);
  }

  @Patch(':creatorId/contracts/:contractId')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator contract metadata' })
  @ApiResponse({ status: 200, description: 'Creator contract updated' })
  @ApiResponse({ status: 404, description: 'Creator or contract not found' })
  updateContract(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('contractId') contractId: string,
    @Body(new ZodValidationPipe(UpdateCreatorContractSchema)) body: UpdateCreatorContractInput,
  ) {
    return this.creatorsContractsService.updateContract(user, creatorId, contractId, body);
  }

  @Post(':creatorId/contracts/:contractId/versions')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Register an uploaded contract version' })
  @ApiResponse({ status: 201, description: 'Contract version added' })
  @ApiResponse({ status: 404, description: 'Creator or contract not found' })
  addContractVersion(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('contractId') contractId: string,
    @Body(new ZodValidationPipe(CreateCreatorContractVersionSchema))
    body: CreateCreatorContractVersionInput,
  ) {
    return this.creatorsContractsService.addContractVersion(user, creatorId, contractId, body);
  }

  @Post(':creatorId/contracts/:contractId/status')
  @RequirePermissions('crm:update')
  @ApiOperation({ summary: 'Update creator contract workflow status' })
  @ApiResponse({ status: 200, description: 'Creator contract status updated' })
  @ApiResponse({ status: 404, description: 'Creator or contract not found' })
  updateContractStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('contractId') contractId: string,
    @Body(new ZodValidationPipe(UpdateCreatorContractStatusSchema))
    body: UpdateCreatorContractStatusInput,
  ) {
    return this.creatorsContractsService.updateContractStatus(user, creatorId, contractId, body);
  }

  @Post(':creatorId/contracts/:contractId/download')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'Create a presigned download URL for a contract version' })
  @ApiResponse({ status: 200, description: 'Presigned download URL generated' })
  @ApiResponse({ status: 404, description: 'Creator or contract not found' })
  downloadContract(
    @CurrentUser() user: AccessTokenPayload,
    @Param('creatorId') creatorId: string,
    @Param('contractId') contractId: string,
    @Body(new ZodValidationPipe(DownloadCreatorContractSchema))
    body: DownloadCreatorContractInput,
  ) {
    return this.creatorsContractsService.downloadContract(user, creatorId, contractId, body);
  }
}
