import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MAX_EVIDENCE_PHOTOS,
  parseEvidencePhotos,
  serializeEvidencePhotos,
  countEvidencePhotos,
  formatEvidencePhotoLabel,
} from '../../src/utils/evidencePhotos';
import {
  LOCAL_STORAGE_NOTES_KEY,
  getIsoWeekRange,
  getMonthKey,
  filterVisibleCalendarNotes,
  canEditCalendarNote,
  groupCalendarNotesForView,
  fetchCalendarNotesFromStore,
  upsertCalendarNoteInStore,
  deleteCalendarNoteInStore,
} from '../../src/utils/calendarNotes';

describe('evidencePhotos utility', () => {
  it('parses empty, single string, JSON array strings, arrays, and invalid JSON safely', () => {
    expect(parseEvidencePhotos(null)).toEqual([]);
    expect(parseEvidencePhotos(undefined)).toEqual([]);
    expect(parseEvidencePhotos('')).toEqual([]);
    expect(parseEvidencePhotos('   ')).toEqual([]);

    expect(parseEvidencePhotos('https://cdn.example.com/a.jpg')).toEqual(['https://cdn.example.com/a.jpg']);
    expect(parseEvidencePhotos('data:image/png;base64,AAA')).toEqual(['data:image/png;base64,AAA']);

    expect(parseEvidencePhotos('["https://a.jpg", "https://b.jpg"]')).toEqual([
      'https://a.jpg',
      'https://b.jpg',
    ]);
    expect(parseEvidencePhotos([' https://a.jpg ', '', null, 'https://b.jpg'])).toEqual([
      'https://a.jpg',
      'https://b.jpg',
    ]);
    expect(parseEvidencePhotos('[invalid-json')).toEqual([]);
  });

  it('serializes 0 -> null, 1 -> plain string, 2..5 -> JSON string, and caps at MAX_EVIDENCE_PHOTOS', () => {
    expect(MAX_EVIDENCE_PHOTOS).toBe(5);
    expect(serializeEvidencePhotos([])).toBeNull();
    expect(serializeEvidencePhotos(['https://only-one.jpg'])).toBe('https://only-one.jpg');

    const two = serializeEvidencePhotos(['https://1.jpg', 'https://2.jpg']);
    expect(two).toBe('["https://1.jpg","https://2.jpg"]');

    const seven = serializeEvidencePhotos([
      'https://1.jpg',
      'https://2.jpg',
      'https://3.jpg',
      'https://4.jpg',
      'https://5.jpg',
      'https://6.jpg',
      'https://7.jpg',
    ]);
    expect(parseEvidencePhotos(seven)).toHaveLength(5);
    expect(parseEvidencePhotos(seven)).toEqual([
      'https://1.jpg',
      'https://2.jpg',
      'https://3.jpg',
      'https://4.jpg',
      'https://5.jpg',
    ]);
  });

  it('counts and formats labels for 0, 1, and multiple photos', () => {
    expect(countEvidencePhotos(null)).toBe(0);
    expect(countEvidencePhotos('https://one.jpg')).toBe(1);
    expect(countEvidencePhotos('["https://1.jpg","https://2.jpg"]')).toBe(2);

    expect(formatEvidencePhotoLabel(null)).toBe('');
    expect(formatEvidencePhotoLabel('https://one.jpg')).toBe('1 captura adjunta');
    expect(formatEvidencePhotoLabel('["https://1.jpg","https://2.jpg","https://3.jpg"]')).toBe(
      '3 capturas adjuntas'
    );
  });
});

describe('calendarNotes utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('computes Monday-Sunday ISO week ranges including month boundaries', () => {
    // 2026-11-30 es Lunes -> semana del 2026-11-30 al 2026-12-06
    expect(getIsoWeekRange('2026-11-30')).toEqual({
      startStr: '2026-11-30',
      endStr: '2026-12-06',
    });
    // 2026-11-22 es Domingo -> semana del 2026-11-16 al 2026-11-22
    expect(getIsoWeekRange('2026-11-22')).toEqual({
      startStr: '2026-11-16',
      endStr: '2026-11-22',
    });
    expect(getMonthKey('2026-11-20')).toBe('2026-11');
  });

  it('filters notes by visibility (personal, area, company) and checks edit permissions', () => {
    const collabA = { id: 'u1', is_master_admin: false, roles: { access_level: 3, area_id: 'a1' } };
    const collabSameArea = { id: 'u2', is_master_admin: false, roles: { access_level: 3, area_id: 'a1' } };
    const collabOtherArea = { id: 'u3', is_master_admin: false, roles: { access_level: 3, area_id: 'a2' } };
    const master = { id: 'admin1', is_master_admin: true, roles: { access_level: 1, area_id: 'a1' } };

    const notes = [
      { id: 'n1', profile_id: 'u1', area_id: 'a1', visibility: 'personal', title: 'Privada u1' },
      { id: 'n2', profile_id: 'u1', area_id: 'a1', visibility: 'area', title: 'Nota área a1' },
      { id: 'n3', profile_id: 'u3', area_id: 'a2', visibility: 'company', title: 'Comunicado empresa' },
      { id: 'n4', profile_id: 'u3', area_id: 'a2', visibility: 'personal', title: 'Privada u3' },
    ];

    expect(filterVisibleCalendarNotes(notes, collabA).map((n) => n.id)).toEqual(['n1', 'n2', 'n3']);
    expect(filterVisibleCalendarNotes(notes, collabSameArea).map((n) => n.id)).toEqual(['n2', 'n3']);
    expect(filterVisibleCalendarNotes(notes, collabOtherArea).map((n) => n.id)).toEqual(['n3', 'n4']);

    expect(canEditCalendarNote(notes[0], collabA)).toBe(true);
    expect(canEditCalendarNote(notes[1], collabSameArea)).toBe(false);
    expect(canEditCalendarNote(notes[3], master)).toBe(true);
  });

  it('groups notes cleanly into dayNotesByDate, weekNotes, and monthNotes', () => {
    const notes = [
      { id: 'd1', note_date: '2026-11-20', scope: 'day', title: 'Cierre diario' },
      { id: 'w1', note_date: '2026-11-18', scope: 'week', title: 'Meta semanal' },
      { id: 'w_other', note_date: '2026-11-10', scope: 'week', title: 'Otra semana' },
      { id: 'm1', note_date: '2026-11-01', scope: 'month', title: 'Cierre noviembre' },
      { id: 'm_other', note_date: '2026-12-01', scope: 'month', title: 'Cierre diciembre' },
    ];

    const grouped = groupCalendarNotesForView(notes, { anchorDateStr: '2026-11-20' });
    expect(grouped.dayNotesByDate['2026-11-20'].map((n) => n.id)).toEqual(['d1']);
    expect(grouped.weekNotes.map((n) => n.id)).toEqual(['w1']);
    expect(grouped.monthNotes.map((n) => n.id)).toEqual(['m1']);
  });

  it('falls back seamlessly to localStorage when Supabase reports missing table 42P01', async () => {
    const missingTableSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(async () => ({
            data: null,
            error: { code: '42P01', message: 'relation "calendar_notes" does not exist' },
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: null,
              error: { code: '42P01', message: 'relation "calendar_notes" does not exist' },
            })),
          })),
        })),
      })),
    };

    const profile = { id: 'emp_1', roles: { area_id: 'area_1' } };
    const saved = await upsertCalendarNoteInStore(
      missingTableSupabase,
      {
        title: 'Reunión Nova Local',
        content: 'Revisar balance',
        note_date: '2026-11-20',
        scope: 'day',
        category: 'nova',
        visibility: 'personal',
      },
      profile
    );

    expect(saved.source).toBe('local');
    expect(saved.note.id).toMatch(/^local-/);
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_NOTES_KEY))).toHaveLength(1);

    // Editar nota local
    const edited = await upsertCalendarNoteInStore(
      missingTableSupabase,
      { ...saved.note, title: 'Reunión Nova Editada' },
      profile
    );
    expect(edited.note.title).toBe('Reunión Nova Editada');

    // Leer de nuevo
    const loaded = await fetchCalendarNotesFromStore(missingTableSupabase);
    expect(loaded.source).toBe('local');
    expect(loaded.notes).toHaveLength(1);
    expect(loaded.notes[0].title).toBe('Reunión Nova Editada');

    // Eliminar nota local
    await deleteCalendarNoteInStore(missingTableSupabase, edited.note.id);
    const afterDelete = await fetchCalendarNotesFromStore(missingTableSupabase);
    expect(afterDelete.notes).toHaveLength(0);
  });
});
