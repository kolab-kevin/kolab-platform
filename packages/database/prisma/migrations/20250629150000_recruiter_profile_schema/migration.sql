-- CreateEnum
CREATE TYPE "RecruiterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "recruiter_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "nickname" TEXT,
    "territory" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hire_date" TIMESTAMP(3),
    "commission_plan" "CommissionPlan" NOT NULL DEFAULT 'STANDARD',
    "monthly_lead_goal" INTEGER,
    "monthly_creator_goal" INTEGER,
    "availability" JSONB NOT NULL DEFAULT '{}',
    "manager_user_id" TEXT,
    "status" "RecruiterStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_profiles_organization_id_user_id_key" ON "recruiter_profiles"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "recruiter_profiles_organization_id_idx" ON "recruiter_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "recruiter_profiles_user_id_idx" ON "recruiter_profiles"("user_id");

-- CreateIndex
CREATE INDEX "recruiter_profiles_manager_user_id_idx" ON "recruiter_profiles"("manager_user_id");

-- CreateIndex
CREATE INDEX "recruiter_profiles_organization_id_status_idx" ON "recruiter_profiles"("organization_id", "status");

-- AddForeignKey
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
