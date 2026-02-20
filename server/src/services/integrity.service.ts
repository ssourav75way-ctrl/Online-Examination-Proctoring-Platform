import prisma from "../config/database.config";
import { similarityService } from "./similarity.service";
import {
  CandidateIntegrityReport,
  IntegrityScoreFactors,
} from "../types/grading.types";

/**
 * Integrity scoring engine — generates per-candidate integrity scores.
 */
export class IntegrityService {
  /**
   * Calculate integrity score for a candidate session.
   * Based on: proctoring flags, timing anomalies, tab switches, collusion score.
   */
  calculateIntegrityScore(factors: IntegrityScoreFactors): number {
    let score = 100;

    // Deduct for proctor flags (severity-weighted)
    score -= factors.proctorFlagSeveritySum * 5;

    // Deduct for timing anomalies
    score -= factors.timingAnomalyCount * 8;

    // Deduct for tab switches
    score -= factors.tabSwitchCount * 6;

    // Deduct for collusion
    score -= factors.collusionScore * 30;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Detect timing anomalies: questions answered suspiciously fast.
   * Hard questions (difficulty >= 7) answered in < 5 seconds.
   */
  async detectTimingAnomalies(sessionId: string): Promise<number> {
    const answers = await prisma.candidateAnswer.findMany({
      where: { sessionId },
      include: {
        examQuestion: {
          include: { questionVersion: { select: { difficulty: true } } },
        },
      },
    });

    let anomalyCount = 0;
    for (const answer of answers) {
      const difficulty = answer.examQuestion.questionVersion.difficulty;
      if (difficulty >= 7 && answer.timeTakenSeconds < 5) {
        anomalyCount++;
        // Create a proctor flag for this anomaly
        await prisma.proctorFlag.create({
          data: {
            sessionId,
            flagType: "TIMING_ANOMALY",
            description: `Answered difficulty ${difficulty} question in ${answer.timeTakenSeconds}s`,
            severity: 3,
          },
        });
      }
    }

    return anomalyCount;
  }

  /**
   * Generate full integrity report for an exam.
   */
  async generateExamIntegrityReport(
    examId: string,
  ): Promise<CandidateIntegrityReport[]> {
    const enrollments = await prisma.examEnrollment.findMany({
      where: { examId, status: "COMPLETED" },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        session: {
          include: {
            flags: true,
            violations: true,
            answers: {
              include: {
                examQuestion: {
                  include: {
                    questionVersion: { select: { difficulty: true } },
                  },
                },
              },
            },
          },
        },
        result: true,
      },
    });

    // Calculate collusion scores between all candidate pairs
    const collusionScores = await this.detectCollusion(examId, enrollments);

    const reports: CandidateIntegrityReport[] = [];

    for (const enrollment of enrollments) {
      if (!enrollment.session) continue;

      const factors: IntegrityScoreFactors = {
        proctorFlagCount: enrollment.session.flags.length,
        proctorFlagSeveritySum: enrollment.session.flags.reduce(
          (s, f) => s + f.severity,
          0,
        ),
        timingAnomalyCount: enrollment.session.flags.filter(
          (f) => f.flagType === "TIMING_ANOMALY",
        ).length,
        collusionScore: collusionScores.get(enrollment.candidateId) || 0,
        tabSwitchCount: enrollment.session.tabSwitchCount,
      };

      const integrityScore = this.calculateIntegrityScore(factors);

      // Update result with integrity score
      if (enrollment.result) {
        await prisma.examResult.update({
          where: { id: enrollment.result.id },
          data: {
            integrityScore,
            timingAnomalyCount: factors.timingAnomalyCount,
            collusionScore: factors.collusionScore,
          },
        });
      }

      reports.push({
        candidateId: enrollment.candidateId,
        candidateName: `${enrollment.candidate.firstName} ${enrollment.candidate.lastName}`,
        integrityScore,
        proctorFlags: factors.proctorFlagCount,
        timingAnomalies: factors.timingAnomalyCount,
        collusionScore: factors.collusionScore,
        tabSwitches: factors.tabSwitchCount,
        evidenceIds: enrollment.session.flags.map((f) => f.id),
      });
    }

    // Sort by integrity score ascending (lowest integrity first)
    reports.sort((a, b) => a.integrityScore - b.integrityScore);

    return reports;
  }

  /**
   * Detect collusion between candidates using answer pattern similarity.
   */
  private async detectCollusion(
    examId: string,
    enrollments: Array<{
      candidateId: string;
      session: {
        answers: Array<{
          examQuestionId: string;
          examQuestion: { questionVersion: { difficulty: number } };
          finalScore: number | null;
          timeTakenSeconds: number;
        }>;
      } | null;
    }>,
  ): Promise<Map<string, number>> {
    const candidateScores = new Map<string, number>();
    const candidateAnswers = new Map<
      string,
      { questionId: string; score: number }[]
    >();

    for (const enrollment of enrollments) {
      if (!enrollment.session) continue;

      candidateAnswers.set(
        enrollment.candidateId,
        enrollment.session.answers.map((a) => ({
          questionId: a.examQuestionId,
          score: a.finalScore || 0,
        })),
      );
    }

    const candidateIds = [...candidateAnswers.keys()];

    for (let i = 0; i < candidateIds.length; i++) {
      for (let j = i + 1; j < candidateIds.length; j++) {
        const answers1 = candidateAnswers.get(candidateIds[i])!;
        const answers2 = candidateAnswers.get(candidateIds[j])!;

        const similarity = similarityService.compareAnswerPatterns(
          answers1,
          answers2,
        );

        // Update max collusion score for each candidate
        const existing1 = candidateScores.get(candidateIds[i]) || 0;
        const existing2 = candidateScores.get(candidateIds[j]) || 0;
        candidateScores.set(candidateIds[i], Math.max(existing1, similarity));
        candidateScores.set(candidateIds[j], Math.max(existing2, similarity));
      }
    }

    return candidateScores;
  }
}

export const integrityService = new IntegrityService();
