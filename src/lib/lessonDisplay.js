export const REVIEW_PRACTICE_HELP_TEXT = 'This page contains review questions and textbook practice prompts for self-study. Interactive quiz submission is planned as future work.';

export function getLessonTypeLabel(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'quiz') return 'Review';
  if (normalized === 'practice') return 'Self-practice';
  if (normalized === 'exercise') return 'Review & Practice';
  return 'Lesson';
}

export function isReviewOrPracticeLesson(type) {
  return ['quiz', 'practice', 'exercise'].includes(String(type || '').toLowerCase());
}
