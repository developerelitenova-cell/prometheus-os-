import { describe, it, expect } from 'vitest';
import {
  getBogotaDateStr,
  parseTaskDueBogota,
  isTaskOverdueBogota,
  getDaysOverdueBogota,
} from '../../src/utils/bogotaTime';
import { computeReminderTriggers } from '../../src/utils/notifications';

describe('bogotaTime & reminder trigger calculations (America/Bogota UTC-5)', () => {
  it('computes 48h, 24h and 2h triggers accurately in UTC-5', () => {
    const now = new Date('2026-11-10T10:00:00-05:00');
    const triggers = computeReminderTriggers('2026-11-13', '10:00:00', now);

    expect(triggers).toHaveLength(3);
    expect(triggers.map((t) => t.reminder_type)).toEqual(['48h', '24h', '2h']);
    expect(triggers[0].trigger_at).toBe(new Date('2026-11-11T10:00:00-05:00').toISOString());
    expect(triggers[1].trigger_at).toBe(new Date('2026-11-12T10:00:00-05:00').toISOString());
    expect(triggers[2].trigger_at).toBe(new Date('2026-11-13T08:00:00-05:00').toISOString());
  });

  it('triggers immediate reminder when less than 2 hours remain', () => {
    const now = new Date('2026-11-10T14:30:00-05:00');
    const triggers = computeReminderTriggers('2026-11-10', '15:30:00', now);

    expect(triggers).toHaveLength(1);
    expect(triggers[0].reminder_type).toBe('immediate');
    expect(triggers[0].is_immediate).toBe(true);
  });

  it('detects overdue pending tasks in America/Bogota timezone', () => {
    const now = new Date('2026-11-11T09:00:00-05:00');
    expect(getBogotaDateStr(now)).toBe('2026-11-11');

    expect(isTaskOverdueBogota({ status: 'pending', due_date: '2026-11-10' }, now)).toBe(true);
    expect(isTaskOverdueBogota({ status: 'pending', due_date: '2026-11-11' }, now)).toBe(false);
    expect(isTaskOverdueBogota({ status: 'completed', due_date: '2026-11-10' }, now)).toBe(false);
    expect(getDaysOverdueBogota('2026-11-08', now)).toBe(3);

    const parsed = parseTaskDueBogota('2026-11-15', '17:00');
    expect(parsed.toISOString()).toBe('2026-11-15T22:00:00.000Z');
  });
});

