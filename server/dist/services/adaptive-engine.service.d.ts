import { QuestionDeliveryItem, AdaptiveState } from "../types/exam.types";
export declare class AdaptiveEngineService {
    getNextQuestion(sessionId: string, examId: string, adaptiveState: AdaptiveState): Promise<QuestionDeliveryItem | null>;
    getNextQuestionSequential(sessionId: string, examId: string, currentIndex: number): Promise<QuestionDeliveryItem | null>;
    private calculateTargetDifficulty;
    updateAdaptiveState(state: AdaptiveState, topic: string, isCorrect: boolean, questionDifficulty: number): AdaptiveState;
    private generateScreenReaderHint;
}
export declare const adaptiveEngineService: AdaptiveEngineService;
//# sourceMappingURL=adaptive-engine.service.d.ts.map