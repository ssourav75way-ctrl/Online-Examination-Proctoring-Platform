/*
  Warnings:

  - You are about to drop the column `poolQuota` on the `exam_questions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currentVersionId]` on the table `questions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "exam_questions" DROP CONSTRAINT "exam_questions_poolId_fkey";

-- AlterTable
ALTER TABLE "exam_enrollments" ADD COLUMN     "accommodationId" TEXT,
ADD COLUMN     "effectiveEndTime" TIMESTAMP(3),
ADD COLUMN     "effectiveStartTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "exam_questions" DROP COLUMN "poolQuota";

-- AlterTable
ALTER TABLE "exam_sessions" ADD COLUMN     "autoPauseAdjustmentMs" INTEGER,
ADD COLUMN     "autoPauseTriggered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "question_pools" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "question_versions" ADD COLUMN     "isLatest" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "exam_pool_configs" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "quota" INTEGER NOT NULL,

    CONSTRAINT "exam_pool_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_adaptive_configs" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "targetDifficultySum" DOUBLE PRECISION NOT NULL,
    "difficultyTolerance" DOUBLE PRECISION NOT NULL DEFAULT 0.1,

    CONSTRAINT "exam_adaptive_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_topic_quotas" (
    "id" TEXT NOT NULL,
    "adaptiveConfigId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "minQuestions" INTEGER NOT NULL,
    "maxQuestions" INTEGER NOT NULL,
    "targetDifficulty" DOUBLE PRECISION,

    CONSTRAINT "exam_topic_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_question_sets" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "examQuestionId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "difficultyAtSelection" INTEGER,

    CONSTRAINT "attempt_question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_time_adjustments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "adjustedById" TEXT NOT NULL,
    "previousDeadline" TIMESTAMP(3) NOT NULL,
    "newDeadline" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_time_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_execution_results" (
    "id" TEXT NOT NULL,
    "candidateAnswerId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "actualOutput" TEXT,
    "runtimeMs" INTEGER,
    "errorOutput" TEXT,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "code_execution_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collusion_pairs" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "sessionAId" TEXT NOT NULL,
    "sessionBId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "matchingAnswers" INTEGER NOT NULL,
    "totalAnswers" INTEGER NOT NULL,
    "evidence" JSONB,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collusion_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_analytics" (
    "id" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL,
    "correctAttempts" INTEGER NOT NULL,
    "difficultyIndex" DOUBLE PRECISION NOT NULL,
    "discriminationIndex" DOUBLE PRECISION,
    "distractorAnalysis" JSONB,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_pool_configs_examId_poolId_key" ON "exam_pool_configs"("examId", "poolId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_adaptive_configs_examId_key" ON "exam_adaptive_configs"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_topic_quotas_adaptiveConfigId_topic_key" ON "exam_topic_quotas"("adaptiveConfigId", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_question_sets_enrollmentId_examQuestionId_key" ON "attempt_question_sets"("enrollmentId", "examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "code_execution_results_candidateAnswerId_testCaseId_key" ON "code_execution_results"("candidateAnswerId", "testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "collusion_pairs_sessionAId_sessionBId_key" ON "collusion_pairs"("sessionAId", "sessionBId");

-- CreateIndex
CREATE UNIQUE INDEX "question_analytics_questionVersionId_examId_key" ON "question_analytics"("questionVersionId", "examId");

-- CreateIndex
CREATE INDEX "exam_enrollments_candidateId_effectiveStartTime_effectiveEn_idx" ON "exam_enrollments"("candidateId", "effectiveStartTime", "effectiveEndTime");

-- CreateIndex
CREATE INDEX "exams_institutionId_status_idx" ON "exams"("institutionId", "status");

-- CreateIndex
CREATE INDEX "exams_scheduledStartTime_scheduledEndTime_idx" ON "exams"("scheduledStartTime", "scheduledEndTime");

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_idx" ON "notifications"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "proctor_flags_sessionId_reviewStatus_idx" ON "proctor_flags"("sessionId", "reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "questions_currentVersionId_key" ON "questions"("currentVersionId");

-- CreateIndex
CREATE INDEX "questions_poolId_isActive_topic_idx" ON "questions"("poolId", "isActive", "topic");

-- CreateIndex
CREATE INDEX "violation_logs_sessionId_occurredAt_idx" ON "violation_logs"("sessionId", "occurredAt");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "question_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_pool_configs" ADD CONSTRAINT "exam_pool_configs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_pool_configs" ADD CONSTRAINT "exam_pool_configs_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "question_pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_adaptive_configs" ADD CONSTRAINT "exam_adaptive_configs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_topic_quotas" ADD CONSTRAINT "exam_topic_quotas_adaptiveConfigId_fkey" FOREIGN KEY ("adaptiveConfigId") REFERENCES "exam_adaptive_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_enrollments" ADD CONSTRAINT "exam_enrollments_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "accommodations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_question_sets" ADD CONSTRAINT "attempt_question_sets_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "exam_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_question_sets" ADD CONSTRAINT "attempt_question_sets_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "exam_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_question_sets" ADD CONSTRAINT "attempt_question_sets_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_time_adjustments" ADD CONSTRAINT "session_time_adjustments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_time_adjustments" ADD CONSTRAINT "session_time_adjustments_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_execution_results" ADD CONSTRAINT "code_execution_results_candidateAnswerId_fkey" FOREIGN KEY ("candidateAnswerId") REFERENCES "candidate_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_execution_results" ADD CONSTRAINT "code_execution_results_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "question_test_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_execution_results" ADD CONSTRAINT "code_execution_results_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collusion_pairs" ADD CONSTRAINT "collusion_pairs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collusion_pairs" ADD CONSTRAINT "collusion_pairs_sessionAId_fkey" FOREIGN KEY ("sessionAId") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collusion_pairs" ADD CONSTRAINT "collusion_pairs_sessionBId_fkey" FOREIGN KEY ("sessionBId") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_analytics" ADD CONSTRAINT "question_analytics_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_analytics" ADD CONSTRAINT "question_analytics_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
