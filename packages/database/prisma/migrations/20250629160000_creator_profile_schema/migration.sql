-- CreateEnum
CREATE TYPE "CreatorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_lead_id" TEXT,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "country" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability" JSONB NOT NULL DEFAULT '{}',
    "status" "CreatorStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "recruiter_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_platform_accounts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "platform" "PlatformType" NOT NULL,
    "username" TEXT NOT NULL,
    "profile_url" TEXT,
    "followers" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "LeadPlatformAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_source_lead_id_key" ON "creator_profiles"("source_lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_organization_id_user_id_key" ON "creator_profiles"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "creator_profiles_organization_id_idx" ON "creator_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "creator_profiles_user_id_idx" ON "creator_profiles"("user_id");

-- CreateIndex
CREATE INDEX "creator_profiles_recruiter_user_id_idx" ON "creator_profiles"("recruiter_user_id");

-- CreateIndex
CREATE INDEX "creator_profiles_organization_id_status_idx" ON "creator_profiles"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "creator_platform_accounts_organization_id_platform_username_key" ON "creator_platform_accounts"("organization_id", "platform", "username");

-- CreateIndex
CREATE INDEX "creator_platform_accounts_creator_profile_id_idx" ON "creator_platform_accounts"("creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_platform_accounts_organization_id_platform_idx" ON "creator_platform_accounts"("organization_id", "platform");

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_source_lead_id_fkey" FOREIGN KEY ("source_lead_id") REFERENCES "creator_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_recruiter_user_id_fkey" FOREIGN KEY ("recruiter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_platform_accounts" ADD CONSTRAINT "creator_platform_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_platform_accounts" ADD CONSTRAINT "creator_platform_accounts_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
