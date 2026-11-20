/**
 * Utilidades para anotaciones editables del Calendario (Día, Semana y Mes)
 * con filtro por visibilidad y fallback transparente a localStorage.
 */

export const LOCAL_STORAGE_NOTES_KEY = 'novawork_calendar_notes_v1';

export const CALENDAR_NOTE_CATEGORIES = [
  {
    key: 'nova',
    label: 'Nova Work',
    icon: 'auto_awesome',
    badgeClasses: 'bg-[#b08d57]/15 text-[#8a6d3d] border-[#b08d57]/35',
    cardClasses: 'bg-[#fdf8ee] border-[#b08d57]/45 text-[#5c451f]',
  },
  {
    key: 'important',
    label: 'Importante',
    icon: 'priority_high',
    badgeClasses: 'bg-red-100 text-red-700 border-red-200',
    cardClasses: 'bg-[#fff5f5] border-[#ff3b30]/40 text-[#9b1c1c]',
  },
  {
    key: 'meeting',
    label: 'Reunión / Acuerdo',
    icon: 'groups',
    badgeClasses: 'bg-blue-100 text-[#0071e3] border-blue-200',
    cardClasses: 'bg-[#f0f7ff] border-[#0071e3]/35 text-[#004c99]',
  },
  {
    key: 'reminder',
    label: 'Recordatorio',
    icon: 'notifications_active',
    badgeClasses: 'bg-amber-100 text-amber-800 border-amber-200',
    cardClasses: 'bg-amber-50 border-amber-300 text-amber-900',
  },
];

export const CALENDAR_NOTE_SCOPES = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

export function getCategoryMeta(category) {
  return (
    CALENDAR_NOTE_CATEGORIES.find((c) => c.key === category) ||
    CALENDAR_NOTE_CATEGORIES[0]
  );
}

export function getScopeLabel(scope) {
  const found = CALENDAR_NOTE_SCOPES.find((s) => s.key === scope);
  return found ? found.label : 'Día';
}

/**
 * Calcula inicio (Lunes) y fin (Domingo) ISO YYYY-MM-DD de la semana a la que pertenece dateStr.
 */
export function getIsoWeekRange(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { startStr: '', endStr: '' };
  }
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return { startStr: '', endStr: '' };

  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dow = (anchor.getUTCDay() + 6) % 7; // Lunes = 0
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - dow);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const fmt = (dt) => {
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  return { startStr: fmt(monday), endStr: fmt(sunday) };
}

export function getMonthKey(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  return dateStr.slice(0, 7);
}

/**
 * Filtra notas visibles para el usuario autenticado respetando visibilidad personal/área/empresa.
 */
export function filterVisibleCalendarNotes(notes = [], currentProfile = null) {
  const list = Array.isArray(notes) ? notes : [];
  if (!currentProfile) {
    return list.filter((n) => n?.visibility === 'company');
  }

  const isMaster = Boolean(currentProfile.is_master_admin);
  const accessLevel = currentProfile.roles?.access_level ?? 3;
  const isExecLeader = !isMaster && accessLevel === 1;
  const profileAreaId = currentProfile.roles?.area_id || null;

  return list.filter((note) => {
    if (!note) return false;
    if (note.profile_id && note.profile_id === currentProfile.id) return true;
    if (note.visibility === 'company') return true;
    if (note.visibility === 'area') {
      if (isMaster || isExecLeader) return true;
      return Boolean(profileAreaId && note.area_id && note.area_id === profileAreaId);
    }
    return false;
  });
}

/**
 * Determina si el perfil puede editar o eliminar la nota.
 */
export function canEditCalendarNote(note, currentProfile) {
  if (!note || !currentProfile) return false;
  if (currentProfile.is_master_admin) return true;
  return Boolean(note.profile_id && note.profile_id === currentProfile.id);
}

/**
 * Agrupa notas para renderizado eficiente en vistas Mes, Semana y Día.
 */
export function groupCalendarNotesForView(notes = [], { anchorDateStr = '', weekStartStr = '', weekEndStr = '' } = {}) {
  const list = Array.isArray(notes) ? notes : [];
  const computedWeek = weekStartStr && weekEndStr
    ? { startStr: weekStartStr, endStr: weekEndStr }
    : getIsoWeekRange(anchorDateStr);
  const targetMonth = getMonthKey(anchorDateStr);

  const dayNotesByDate = {};
  const weekNotes = [];
  const monthNotes = [];

  for (const note of list) {
    if (!note?.note_date) continue;
    const dateKey = String(note.note_date).slice(0, 10);
    const scope = note.scope || 'day';

    if (scope === 'day') {
      if (!dayNotesByDate[dateKey]) dayNotesByDate[dateKey] = [];
      dayNotesByDate[dateKey].push(note);
    } else if (scope === 'week') {
      if (
        computedWeek.startStr &&
        computedWeek.endStr &&
        dateKey >= computedWeek.startStr &&
        dateKey <= computedWeek.endStr
      ) {
        weekNotes.push(note);
      }
    } else if (scope === 'month') {
      if (targetMonth && getMonthKey(dateKey) === targetMonth) {
        monthNotes.push(note);
      }
    }
  }

  return { dayNotesByDate, weekNotes, monthNotes };
}

// ── Persistencia con fallback localStorage ────────────────────────────────────

export function isMissingTableError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || error.details || error.hint || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('calendar_notes') ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  );
}

export function readLocalCalendarNotes() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalCalendarNotes(notes) {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes || []));
  } catch (err) {
    console.warn('No se pudo guardar notas locales de calendario:', err);
  }
}

function sortNotesChronological(notes) {
  return [...notes].sort((a, b) => {
    const da = String(a?.note_date || '').slice(0, 10);
    const db = String(b?.note_date || '').slice(0, 10);
    if (da !== db) return da.localeCompare(db);
    return String(a?.created_at || '').localeCompare(String(b?.created_at || ''));
  });
}

export async function fetchCalendarNotesFromStore(supabase) {
  const localNotes = readLocalCalendarNotes();

  if (!supabase?.from) {
    return { notes: sortNotesChronological(localNotes), source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('calendar_notes')
      .select('*')
      .order('note_date', { ascending: true });

    if (error) {
      if (isMissingTableError(error)) {
        return { notes: sortNotesChronological(localNotes), source: 'local' };
      }
      console.warn('Error cargando calendar_notes en Supabase, usando caché local:', error);
      return { notes: sortNotesChronological(localNotes), source: 'local' };
    }

    const remoteNotes = Array.isArray(data) ? data : [];
    const remoteIds = new Set(remoteNotes.map((n) => n.id));
    const localOnly = localNotes.filter((n) => !remoteIds.has(n.id));
    return {
      notes: sortNotesChronological([...remoteNotes, ...localOnly]),
      source: 'supabase',
    };
  } catch (err) {
    console.warn('Fallback a localStorage para notas de calendario:', err);
    return { notes: sortNotesChronological(localNotes), source: 'local' };
  }
}

export async function upsertCalendarNoteInStore(supabase, noteInput, currentProfile) {
  const nowIso = new Date().toISOString();
  const isEditing = Boolean(noteInput?.id);
  const existingId = noteInput?.id;
  const isLocalId = Boolean(existingId && String(existingId).startsWith('local-'));

  const baseFields = {
    profile_id: noteInput.profile_id || currentProfile?.id || 'local-user',
    area_id: noteInput.area_id ?? currentProfile?.roles?.area_id ?? null,
    note_date: String(noteInput.note_date || '').slice(0, 10),
    scope: noteInput.scope || 'day',
    category: noteInput.category || 'nova',
    visibility: noteInput.visibility || 'personal',
    title: String(noteInput.title || '').trim(),
    content: String(noteInput.content || '').trim(),
    updated_at: nowIso,
  };

  if (supabase?.from && !isLocalId) {
    try {
      const tableRef = supabase.from('calendar_notes');
      let query;
      if (isEditing && typeof tableRef?.update === 'function') {
        query = tableRef
          .update(baseFields)
          .eq('id', existingId)
          .select()
          .single();
      } else if (!isEditing && typeof tableRef?.insert === 'function') {
        query = tableRef
          .insert({ ...baseFields, created_at: nowIso })
          .select()
          .single();
      }

      if (query) {
        const { data, error } = await query;
        if (!error && data) {
          return { note: data, source: 'supabase' };
        }
        if (error && !isMissingTableError(error)) {
          throw new Error(error.message || 'No fue posible guardar la anotación.');
        }
      }
    } catch (err) {
      if (!isMissingTableError(err) && !String(err?.message || '').includes('is not a function')) {
        throw err;
      }
    }
  }

  // Fallback a localStorage (sin migración o entorno local/offline)
  const localNotes = readLocalCalendarNotes();
  const savedNote = {
    ...baseFields,
    id: isEditing ? existingId : `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: isEditing ? (noteInput.created_at || nowIso) : nowIso,
  };

  const idx = localNotes.findIndex((n) => n.id === savedNote.id);
  if (idx >= 0) {
    localNotes[idx] = savedNote;
  } else {
    localNotes.push(savedNote);
  }
  writeLocalCalendarNotes(localNotes);
  return { note: savedNote, source: 'local' };
}

export async function deleteCalendarNoteInStore(supabase, noteId) {
  if (!noteId) return { ok: false };

  const localNotes = readLocalCalendarNotes();
  const filtered = localNotes.filter((n) => n.id !== noteId);
  if (filtered.length !== localNotes.length) {
    writeLocalCalendarNotes(filtered);
  }

  const isLocalId = String(noteId).startsWith('local-');
  if (!isLocalId && supabase?.from) {
    try {
      const tableRef = supabase.from('calendar_notes');
      if (typeof tableRef.delete === 'function') {
        const { error } = await tableRef.delete().eq('id', noteId);
        if (error && !isMissingTableError(error)) {
          throw new Error(error.message || 'No fue posible eliminar la anotación.');
        }
        return { ok: true, source: 'supabase' };
      }
    } catch (err) {
      if (!isMissingTableError(err) && !String(err?.message || '').includes('is not a function')) {
        throw err;
      }
    }
  }

  return { ok: true, source: 'local' };
}
