import prisma from "../config/database.config";
import {
  QuestionDeliveryItem,
  AdaptiveState,
  McqOption,
} from "../types/exam.types";

export class AdaptiveEngineService {
  async getNextQuestion(
    sessionId: string,
    examId: string,
    adaptiveState: AdaptiveState,
  ): Promise<QuestionDeliveryItem | null> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        adaptiveConfig: {
          include: { topicQuotas: true },
        },
        questions: {
          include: {
            question: true,
            questionVersion: {
              include: {
                testCases: {
                  where: { isHidden: false },
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!exam) {
      return null;
    }

    const examQuestions = exam.questions;

    const answeredQuestionIds = new Set(
      (
        await prisma.candidateAnswer.findMany({
          where: { sessionId },
          select: { examQuestionId: true },
        })
      ).map((a) => a.examQuestionId),
    );

    const unanswered = examQuestions.filter(
      (eq) => !answeredQuestionIds.has(eq.id),
    );

    if (unanswered.length === 0) return null;

    
    const topicAnswerCounts: Record<string, number> = {};
    for (const eq of examQuestions) {
      if (answeredQuestionIds.has(eq.id)) {
        const topic = eq.question.topic;
        topicAnswerCounts[topic] = (topicAnswerCounts[topic] || 0) + 1;
      }
    }

    const abilityTargetDifficulty =
      this.calculateTargetDifficulty(adaptiveState);

    
    
    
    if (exam.adaptiveConfig) {
      const targetDifficultySum = exam.adaptiveConfig.targetDifficultySum;
      const totalQuestions = examQuestions.length;

      let sumDifficultySoFar = 0;
      for (const eq of examQuestions) {
        if (answeredQuestionIds.has(eq.id)) {
          sumDifficultySoFar += eq.questionVersion.difficulty;
        }
      }

      const remainingQuestions = unanswered.length;
      const remainingBudget = targetDifficultySum - sumDifficultySoFar;
      const idealPerQuestion =
        remainingQuestions > 0
          ? remainingBudget / remainingQuestions
          : abilityTargetDifficulty;

      
      
      const progress =
        totalQuestions > 0
          ? (totalQuestions - remainingQuestions) / totalQuestions
          : 0;
      const weightAbility = Math.max(0, Math.min(1, 1 - progress));
      const blendedTargetDifficulty =
        weightAbility * abilityTargetDifficulty +
        (1 - weightAbility) * idealPerQuestion;

      const topicGroups = new Map<string, typeof unanswered>();
      for (const eq of unanswered) {
        const topic = eq.question.topic;
        if (!topicGroups.has(topic)) {
          topicGroups.set(topic, []);
        }
        topicGroups.get(topic)!.push(eq);
      }

      const topics = Array.from(topicGroups.keys());
      let selectedTopic = topics[0];
      let minCount = Infinity;

      const zeroTopics = topics.filter(
        (topic) => (topicAnswerCounts[topic] || 0) === 0,
      );

      
      
      if (zeroTopics.length > 0 && remainingQuestions <= zeroTopics.length) {
        selectedTopic = zeroTopics[0];
      } else {
        for (const topic of topics) {
          const count = topicAnswerCounts[topic] || 0;
          if (count < minCount) {
            minCount = count;
            selectedTopic = topic;
          }
        }
      }

      const topicQuestions = topicGroups.get(selectedTopic) || unanswered;

      let selected = topicQuestions[0];
      let bestScore = Infinity;

      for (const eq of topicQuestions) {
        const difficulty = eq.questionVersion.difficulty;
        const score = Math.abs(difficulty - blendedTargetDifficulty);

        if (score < bestScore) {
          bestScore = score;
          selected = eq;
        } else if (score === bestScore && remainingQuestions === 1) {
          
          
          const bestFinalDiff = Math.abs(
            sumDifficultySoFar + selected.questionVersion.difficulty -
              targetDifficultySum,
          );
          const candidateFinalDiff = Math.abs(
            sumDifficultySoFar + difficulty - targetDifficultySum,
          );
          if (candidateFinalDiff < bestFinalDiff) {
            selected = eq;
          }
        }
      }

      const version = selected.questionVersion;

      return {
        examQuestionId: selected.id,
        questionVersionId: version.id,
        type: selected.question.type,
        content: version.content,
        options: version.options as McqOption[] | null,
        codeTemplate: version.codeTemplate,
        codeLanguage: version.codeLanguage,
        marks: version.marks,
        orderIndex: selected.orderIndex,
        screenReaderHint: this.generateScreenReaderHint(
          selected.question.type,
          version.content,
        ),
      };
    }

    const topicGroups = new Map<string, typeof unanswered>();
    for (const eq of unanswered) {
      const topic = eq.question.topic;
      if (!topicGroups.has(topic)) {
        topicGroups.set(topic, []);
      }
      topicGroups.get(topic)!.push(eq);
    }

    const topicCoverage = adaptiveState.topicAccuracyMap;
    let selectedTopic = "";
    let minCoverage = Infinity;

    for (const [topic] of topicGroups) {
      
      
      const coverage = topicAnswerCounts[topic] || 0;
      if (coverage < minCoverage) {
        minCoverage = coverage;
        selectedTopic = topic;
      }
    }

    const topicQuestions = topicGroups.get(selectedTopic) || unanswered;

    const sorted = topicQuestions.sort((a, b) => {
      const diffA = Math.abs(
        a.questionVersion.difficulty - abilityTargetDifficulty,
      );
      const diffB = Math.abs(
        b.questionVersion.difficulty - abilityTargetDifficulty,
      );
      return diffA - diffB;
    });

    const selected = sorted[0];
    const version = selected.questionVersion;

    return {
      examQuestionId: selected.id,
      questionVersionId: version.id,
      type: selected.question.type,
      content: version.content,
      options: version.options as McqOption[] | null,
      codeTemplate: version.codeTemplate,
      codeLanguage: version.codeLanguage,
      marks: version.marks,
      orderIndex: selected.orderIndex,
      screenReaderHint: this.generateScreenReaderHint(
        selected.question.type,
        version.content,
      ),
    };
  }

  async getNextQuestionSequential(
    sessionId: string,
    examId: string,
    currentIndex: number,
  ): Promise<QuestionDeliveryItem | null> {
    const examQuestion = await prisma.examQuestion.findFirst({
      where: { examId, orderIndex: currentIndex },
      include: {
        question: true,
        questionVersion: true,
      },
    });

    if (!examQuestion) return null;

    const version = examQuestion.questionVersion;

    return {
      examQuestionId: examQuestion.id,
      questionVersionId: version.id,
      type: examQuestion.question.type,
      content: version.content,
      options: version.options as McqOption[] | null,
      codeTemplate: version.codeTemplate,
      codeLanguage: version.codeLanguage,
      marks: version.marks,
      orderIndex: examQuestion.orderIndex,
      screenReaderHint: this.generateScreenReaderHint(
        examQuestion.question.type,
        version.content,
      ),
    };
  }

  private calculateTargetDifficulty(state: AdaptiveState): number {
    if (state.questionsServed === 0) return 5; 

    const overallAccuracy =
      state.questionsServed > 0 ? state.runningAccuracy : 0.5;

    let adjustment = 0;
    if (overallAccuracy >= 0.8) adjustment = 2;
    else if (overallAccuracy >= 0.6) adjustment = 1;
    else if (overallAccuracy <= 0.2) adjustment = -2;
    else if (overallAccuracy <= 0.4) adjustment = -1;

    const targetDifficulty = state.currentDifficulty + adjustment;
    return Math.max(1, Math.min(10, targetDifficulty));
  }

  updateAdaptiveState(
    state: AdaptiveState,
    topic: string,
    isCorrect: boolean,
    questionDifficulty: number,
  ): AdaptiveState {
    const newState = { ...state };
    newState.questionsServed++;
    newState.totalDifficulty += questionDifficulty;

    if (!newState.topicAccuracyMap[topic]) {
      newState.topicAccuracyMap[topic] = { correct: 0, total: 0 };
    }

    newState.topicAccuracyMap[topic].total++;
    if (isCorrect) {
      newState.topicAccuracyMap[topic].correct++;
    }

    
    const totalCorrect = Object.values(newState.topicAccuracyMap).reduce(
      (sum, t) => sum + t.correct,
      0,
    );
    const totalAnswered = Object.values(newState.topicAccuracyMap).reduce(
      (sum, t) => sum + t.total,
      0,
    );

    newState.runningAccuracy =
      totalAnswered > 0 ? totalCorrect / totalAnswered : 0;
    newState.currentDifficulty = this.calculateTargetDifficulty(newState);

    return newState;
  }

  private generateScreenReaderHint(type: string, content: string): string {
    const typeLabel: Record<string, string> = {
      MCQ: "Multiple choice question - select one answer",
      MULTI_SELECT: "Multiple select question - select all correct answers",
      FILL_BLANK: "Fill in the blank question - type your answer",
      SHORT_ANSWER: "Short answer question - type your response",
      CODE: "Code question - write and submit your code",
    };

    return `${typeLabel[type] || "Question"}. ${content.substring(0, 100)}`;
  }
}

export const adaptiveEngineService = new AdaptiveEngineService();
