export function calculateAverageScore(scores: number[]) {
  if (!scores.length) {
    return null;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Number((total / scores.length).toFixed(2));
}

export function formatAverageScore(score: number | null) {
  if (score === null) {
    return "-";
  }

  return score.toFixed(2);
}
