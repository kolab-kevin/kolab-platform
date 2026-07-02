-- CreateEnum
CREATE TYPE "CreatorDocumentType" AS ENUM ('GOVERNMENT_ID', 'PASSPORT', 'TAX_FORM', 'BANK_INFO', 'PROFILE_PHOTO', 'CONTRACT_ATTACHMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "CreatorDocumentStatus" AS ENUM ('REQUESTED', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CreatorContractType" AS ENUM ('CREATOR_AGREEMENT', 'AGENCY_AGREEMENT', 'CAMPAIGN_CONTRACT', 'NDA', 'OTHER');

-- CreateEnum
CREATE TYPE "CreatorContractStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'EXPIRED', 'CANCELLED', 'TERMINATED');

-- CreateTable
CREATE TABLE "creator_documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "creator_profile_id" TEXT,
    "source_lead_id" TEXT,
    "document_type" "CreatorDocumentType" NOT NULL,
    "status" "CreatorDocumentStatus" NOT NULL DEFAULT 'REQUESTED',
    "title" TEXT,
    "expires_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_document_versions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "storage_key" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "checksum" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_contracts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "creator_profile_id" TEXT,
    "source_lead_id" TEXT,
    "contract_type" "CreatorContractType" NOT NULL,
    "status" "CreatorContractStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "parent_contract_id" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "signed_by_user_id" TEXT,
    "external_envelope_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_contract_versions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "storage_key" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "checksum" TEXT,
    "signed_at" TIMESTAMP(3),
    "signed_by_user_id" TEXT,
    "external_envelope_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_contract_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_documents_organization_id_idx" ON "creator_documents"("organization_id");

-- CreateIndex
CREATE INDEX "creator_documents_organization_id_creator_profile_id_idx" ON "creator_documents"("organization_id", "creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_documents_organization_id_source_lead_id_idx" ON "creator_documents"("organization_id", "source_lead_id");

-- CreateIndex
CREATE INDEX "creator_documents_organization_id_document_type_idx" ON "creator_documents"("organization_id", "document_type");

-- CreateIndex
CREATE INDEX "creator_documents_organization_id_status_idx" ON "creator_documents"("organization_id", "status");

-- CreateIndex
CREATE INDEX "creator_documents_organization_id_creator_profile_id_documen_idx" ON "creator_documents"("organization_id", "creator_profile_id", "document_type", "status");

-- CreateIndex
CREATE INDEX "creator_documents_organization_id_expires_at_idx" ON "creator_documents"("organization_id", "expires_at");

-- CreateIndex
CREATE INDEX "creator_documents_creator_profile_id_idx" ON "creator_documents"("creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_documents_source_lead_id_idx" ON "creator_documents"("source_lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_document_versions_document_id_version_number_key" ON "creator_document_versions"("document_id", "version_number");

-- CreateIndex
CREATE INDEX "creator_document_versions_organization_id_idx" ON "creator_document_versions"("organization_id");

-- CreateIndex
CREATE INDEX "creator_document_versions_document_id_idx" ON "creator_document_versions"("document_id");

-- CreateIndex
CREATE INDEX "creator_document_versions_uploaded_by_id_idx" ON "creator_document_versions"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "creator_contracts_organization_id_idx" ON "creator_contracts"("organization_id");

-- CreateIndex
CREATE INDEX "creator_contracts_organization_id_creator_profile_id_idx" ON "creator_contracts"("organization_id", "creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_contracts_organization_id_source_lead_id_idx" ON "creator_contracts"("organization_id", "source_lead_id");

-- CreateIndex
CREATE INDEX "creator_contracts_organization_id_contract_type_idx" ON "creator_contracts"("organization_id", "contract_type");

-- CreateIndex
CREATE INDEX "creator_contracts_organization_id_status_idx" ON "creator_contracts"("organization_id", "status");

-- CreateIndex
CREATE INDEX "creator_contracts_organization_id_creator_profile_id_contra_idx" ON "creator_contracts"("organization_id", "creator_profile_id", "contract_type", "status");

-- CreateIndex
CREATE INDEX "creator_contracts_organization_id_valid_until_idx" ON "creator_contracts"("organization_id", "valid_until");

-- CreateIndex
CREATE INDEX "creator_contracts_creator_profile_id_idx" ON "creator_contracts"("creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_contracts_source_lead_id_idx" ON "creator_contracts"("source_lead_id");

-- CreateIndex
CREATE INDEX "creator_contracts_parent_contract_id_idx" ON "creator_contracts"("parent_contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_contract_versions_contract_id_version_number_key" ON "creator_contract_versions"("contract_id", "version_number");

-- CreateIndex
CREATE INDEX "creator_contract_versions_organization_id_idx" ON "creator_contract_versions"("organization_id");

-- CreateIndex
CREATE INDEX "creator_contract_versions_contract_id_idx" ON "creator_contract_versions"("contract_id");

-- CreateIndex
CREATE INDEX "creator_contract_versions_signed_by_user_id_idx" ON "creator_contract_versions"("signed_by_user_id");

-- AddForeignKey
ALTER TABLE "creator_documents" ADD CONSTRAINT "creator_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_documents" ADD CONSTRAINT "creator_documents_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_documents" ADD CONSTRAINT "creator_documents_source_lead_id_fkey" FOREIGN KEY ("source_lead_id") REFERENCES "creator_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_documents" ADD CONSTRAINT "creator_documents_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_document_versions" ADD CONSTRAINT "creator_document_versions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_document_versions" ADD CONSTRAINT "creator_document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "creator_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_document_versions" ADD CONSTRAINT "creator_document_versions_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contracts" ADD CONSTRAINT "creator_contracts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contracts" ADD CONSTRAINT "creator_contracts_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contracts" ADD CONSTRAINT "creator_contracts_source_lead_id_fkey" FOREIGN KEY ("source_lead_id") REFERENCES "creator_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contracts" ADD CONSTRAINT "creator_contracts_parent_contract_id_fkey" FOREIGN KEY ("parent_contract_id") REFERENCES "creator_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contracts" ADD CONSTRAINT "creator_contracts_signed_by_user_id_fkey" FOREIGN KEY ("signed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contract_versions" ADD CONSTRAINT "creator_contract_versions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contract_versions" ADD CONSTRAINT "creator_contract_versions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "creator_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_contract_versions" ADD CONSTRAINT "creator_contract_versions_signed_by_user_id_fkey" FOREIGN KEY ("signed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
