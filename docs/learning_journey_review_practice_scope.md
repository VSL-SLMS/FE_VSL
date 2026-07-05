# Learning Journey Review/Practice Scope

## Current prototype scope

Review/practice pages in the learning journey are learning content. They present textbook review questions, practice prompts, and supporting lesson material for student self-study.

They are not interactive quizzes in the current prototype. The UI must not describe these pages as quizzes because the system does not currently implement quiz attempt submission, auto scoring, or a quiz result workflow.

## Display labels

Stored lesson types are normalized for display only:

- `quiz` displays as `Review`
- `practice` displays as `Self-practice`
- `exercise` displays as `Review & Practice`
- `theory` displays as `Lesson`

Raw enum values are kept internal and should not be shown as student-facing labels.

## Assignment boundary

Teacher-created assignments remain a separate workflow:

- Teacher creates an assignment manually.
- Student submits the assignment.
- Teacher grades or returns the submission.
- Student resubmits when the revision workflow is used.

Review/practice pages are not connected to Teacher assignment creation in this task.

## Future work

Formal quiz attempts, auto scoring, lesson-linked assignment templates, and "Create assignment from this practice" are future work.

No database schema change was made.
