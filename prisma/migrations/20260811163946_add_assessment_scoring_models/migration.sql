-- CreateEnum
CREATE TYPE "diabetes_status" AS ENUM ('diagnosed', 'not_diagnosed');

-- CreateEnum
CREATE TYPE "scoring_branch" AS ENUM ('risk_of_diabetes', 'complication_risk');

-- CreateEnum
CREATE TYPE "classification" AS ENUM ('no_diabetes_low', 'no_diabetes_high', 'diabetes_low', 'diabetes_high');

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "diabetes_status" "diabetes_status" NOT NULL,
    "responses" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_rule_versions" (
    "id" TEXT NOT NULL,
    "branch" "scoring_branch" NOT NULL,
    "version_number" INTEGER NOT NULL,
    "rules" JSONB NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "scoring_rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "scoring_rule_version_id" TEXT NOT NULL,
    "classification" "classification" NOT NULL,
    "score" DECIMAL(10,2),
    "contributing_factors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scoring_rule_versions_branch_version_number_key" ON "scoring_rule_versions"("branch", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "results_assessment_id_key" ON "results"("assessment_id");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_scoring_rule_version_id_fkey" FOREIGN KEY ("scoring_rule_version_id") REFERENCES "scoring_rule_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
