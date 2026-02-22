import type { RetroplanningTask, RetroplanningTaskColor } from '@/types';

/** Format a Date as YYYY-MM-DD string (local timezone-agnostic, treats the Date as a calendar day). */
function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute startDate / endDate for each task by walking backward from the deadline.
 *
 * Algorithm:
 *   - The last task ends at the deadline.
 *   - Each task's endDate = the previous task's startDate (the day before).
 *   - Each task's startDate = endDate - (durationDays - 1)  [inclusive range].
 *
 * Pure JS date arithmetic — no external dependencies.
 *
 * @param tasks  Array of task stubs with id, label, durationDays, color.
 * @param deadline  The final delivery date.
 * @returns RetroplanningTask[] with computed startDate and endDate fields.
 */
export function computeDatesFromDeadline(
  tasks: Array<{ id: string; label: string; durationDays: number; color: RetroplanningTaskColor }>,
  deadline: Date
): RetroplanningTask[] {
  const MS_PER_DAY = 86400000;

  // Work with UTC midnight to avoid DST surprises
  const deadlineUTC = Date.UTC(
    deadline.getUTCFullYear(),
    deadline.getUTCMonth(),
    deadline.getUTCDate()
  );

  const result: RetroplanningTask[] = [];
  let cursor = deadlineUTC; // "current end pointer" — starts at deadline

  // Walk from the last task backwards to the first
  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i];
    const endEpoch = cursor;
    const startEpoch = endEpoch - (task.durationDays - 1) * MS_PER_DAY;

    result[i] = {
      ...task,
      startDate: formatDate(new Date(startEpoch)),
      endDate: formatDate(new Date(endEpoch)),
    };

    // Next task ends the day before this one starts
    cursor = startEpoch - MS_PER_DAY;
  }

  return result;
}

/**
 * Returns the number of calendar days between two ISO YYYY-MM-DD date strings (end - start, inclusive).
 * Used by the Gantt component to compute bar widths.
 */
export function daysBetween(start: string, end: string): number {
  const MS_PER_DAY = 86400000;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Math.round((endMs - startMs) / MS_PER_DAY) + 1;
}
