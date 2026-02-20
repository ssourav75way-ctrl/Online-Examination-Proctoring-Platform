/**
 * Text similarity service for short answer grading.
 * Uses Levenshtein distance and keyword matching.
 */
export class SimilarityService {
  /**
   * Calculate Levenshtein distance between two strings.
   */
  levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[a.length][b.length];
  }

  /**
   * Calculate similarity ratio between two strings (0-1).
   */
  similarityRatio(a: string, b: string): number {
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    const distance = this.levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Jaccard similarity between two sets of words.
   */
  jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(
      a
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0),
    );
    const wordsB = new Set(
      b
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0),
    );

    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Score a short answer based on keyword matching.
   * Each keyword has a weight; total score = sum of matched keyword weights / total weight.
   */
  scoreShortAnswer(
    answer: string,
    keywords: { keyword: string; weight: number }[],
    similarityThreshold: number,
  ): { score: number; matchedKeywords: string[]; unmatchedKeywords: string[] } {
    const normalizedAnswer = answer.toLowerCase();
    const matchedKeywords: string[] = [];
    const unmatchedKeywords: string[] = [];
    let matchedWeight = 0;
    let totalWeight = 0;

    for (const { keyword, weight } of keywords) {
      totalWeight += weight;
      const normalizedKeyword = keyword.toLowerCase();

      // Check exact containment
      if (normalizedAnswer.includes(normalizedKeyword)) {
        matchedKeywords.push(keyword);
        matchedWeight += weight;
        continue;
      }

      // Check similarity against each word in the answer
      const answerWords = normalizedAnswer.split(/\s+/);
      let found = false;
      for (const word of answerWords) {
        if (
          this.similarityRatio(word, normalizedKeyword) >= similarityThreshold
        ) {
          matchedKeywords.push(keyword);
          matchedWeight += weight;
          found = true;
          break;
        }
      }

      if (!found) {
        unmatchedKeywords.push(keyword);
      }
    }

    return {
      score: totalWeight > 0 ? matchedWeight / totalWeight : 0,
      matchedKeywords,
      unmatchedKeywords,
    };
  }

  /**
   * Compare two answer patterns for collusion detection.
   * Uses cosine similarity on answer vectors.
   */
  compareAnswerPatterns(
    answers1: { questionId: string; score: number }[],
    answers2: { questionId: string; score: number }[],
  ): number {
    // Build aligned vectors
    const allQuestionIds = new Set([
      ...answers1.map((a) => a.questionId),
      ...answers2.map((a) => a.questionId),
    ]);

    const map1 = new Map(answers1.map((a) => [a.questionId, a.score]));
    const map2 = new Map(answers2.map((a) => [a.questionId, a.score]));

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const qId of allQuestionIds) {
      const v1 = map1.get(qId) || 0;
      const v2 = map2.get(qId) || 0;
      dotProduct += v1 * v2;
      magnitude1 += v1 * v1;
      magnitude2 += v2 * v2;
    }

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }
}

export const similarityService = new SimilarityService();
