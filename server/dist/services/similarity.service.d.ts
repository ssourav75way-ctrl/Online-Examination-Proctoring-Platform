export declare class SimilarityService {
    levenshteinDistance(a: string, b: string): number;
    similarityRatio(a: string, b: string): number;
    jaccardSimilarity(a: string, b: string): number;
    scoreShortAnswer(answer: string, keywords: {
        keyword: string;
        weight: number;
    }[], similarityThreshold: number): {
        score: number;
        matchedKeywords: string[];
        unmatchedKeywords: string[];
    };
    compareAnswerPatterns(answers1: {
        questionId: string;
        score: number;
    }[], answers2: {
        questionId: string;
        score: number;
    }[]): number;
}
export declare const similarityService: SimilarityService;
//# sourceMappingURL=similarity.service.d.ts.map