import prisma from "../config/database.config";
import { similarityService } from "./similarity.service";
import {
  CandidateIntegrityReport,
  IntegrityScoreFactors,
} from "../types/grading.types";


export class IntegrityService {

  calculateIntegrityScore(factors: IntegrityScoreFactors): number {
    let score = 100;


    score -= factors.proctorFlagSeveritySum * 5;


    score -= factors.timingAnomalyCount * 8;


    score -= factors.tabSwitchCount * 6;


    score -= factors.collusionScore * 30;

    return Math.max(0, Math.min(100, Math.round(score)));
  }


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


    reports.sort((a, b) => a.integrityScore - b.integrityScore);

    return reports;
  }


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
