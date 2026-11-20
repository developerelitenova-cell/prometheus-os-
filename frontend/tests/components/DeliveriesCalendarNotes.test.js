import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DeliveriesCalendar from '../../src/views/DeliveriesCalendar.vue';
import { getBogotaDateStr } from '../../src/utils/bogotaTime';
import { LOCAL_STORAGE_NOTES_KEY } from '../../src/utils/calendarNotes';

const todayStr = getBogotaDateStr();

const mockState = {
  simulateMissingNotesTable: false,
  currentProfile: {
    id: 'emp_1',
    full_name: 'Ana María',
    is_master_admin: false,
    role_id: 'r_1',
    roles: {
      id: 'r_1',
      name: 'Asistente Presidencia',
      access_level: 3,
      area_id: 'area_1',
      areas: { id: 'area_1', name: 'Presidencia' },
    },
  },
  calendarNotes: [],
};

vi.mock('../../src/api/auth', () => ({
  currentProfile: {
    get value() {
      return mockState.currentProfile;
    },
  },
  loadCurrentProfile: vi.fn(async () => mockState.currentProfile),
}));

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'calendar_notes') {
        const missingErr = {
          code: '42P01',
          message: 'relation "calendar_notes" does not exist',
        };
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => {
              if (mockState.simulateMissingNotesTable) {
                return { data: null, error: missingErr };
              }
              return { data: [...mockState.calendarNotes], error: null };
            }),
          })),
          insert: vi.fn((payload) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                if (mockState.simulateMissingNotesTable) {
                  return { data: null, error: missingErr };
                }
                const created = {
                  ...payload,
                  id: `note_${mockState.calendarNotes.length + 1}`,
                };
                mockState.calendarNotes.push(created);
                return { data: created, error: null };
              }),
            })),
          })),
          update: vi.fn((payload) => ({
            eq: vi.fn((_, id) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  if (mockState.simulateMissingNotesTable) {
                    return { data: null, error: missingErr };
                  }
                  const idx = mockState.calendarNotes.findIndex((n) => n.id === id);
                  if (idx >= 0) {
                    mockState.calendarNotes[idx] = { ...mockState.calendarNotes[idx], ...payload };
                    return { data: mockState.calendarNotes[idx], error: null };
                  }
                  return { data: null, error: { message: 'Not found' } };
                }),
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(async (_, id) => {
              if (mockState.simulateMissingNotesTable) {
                return { error: missingErr };
              }
              mockState.calendarNotes = mockState.calendarNotes.filter((n) => n.id !== id);
              return { error: null };
            }),
          })),
        };
      }

      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
      };
      chain.then = (cb) => cb({ data: [], error: null });
      return chain;
    }),
  },
}));

describe('DeliveriesCalendar.vue Editable Day / Week / Month Annotations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockState.simulateMissingNotesTable = false;
    mockState.calendarNotes = [];
  });

  const mountCalendar = () =>
    mount(DeliveriesCalendar, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });

  it('creates monthly, weekly, and daily annotations, edits an existing note, and deletes it cleanly', async () => {
    const wrapper = mountCalendar();
    await flushPromises();

    // 1. Crear anotación Mensual desde el panel del mes
    await wrapper.find('[data-testid="add-month-note-btn"]').trigger('click');
    expect(wrapper.find('[data-testid="calendar-note-modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="note-scope-select"]').element.value).toBe('month');

    await wrapper.find('[data-testid="note-title-input"]').setValue('Cierre Contable Nova Work');
    await wrapper.find('[data-testid="note-content-input"]').setValue('Consolidar actas antes del 28');
    await wrapper.find('[data-testid="note-category-select"]').setValue('nova');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    const monthPanel = wrapper.find('[data-testid="calendar-month-notes-panel"]');
    expect(monthPanel.text()).toContain('Cierre Contable Nova Work');

    // 2. Cambiar a vista Semana y crear anotación Semanal
    await wrapper.find('[data-testid="view-btn-week"]').trigger('click');
    await wrapper.find('[data-testid="add-week-note-btn"]').trigger('click');
    expect(wrapper.find('[data-testid="note-scope-select"]').element.value).toBe('week');

    await wrapper.find('[data-testid="note-title-input"]').setValue('Meta Semanal Presidencia');
    await wrapper.find('[data-testid="note-category-select"]').setValue('important');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    const weekPanel = wrapper.find('[data-testid="calendar-week-notes-panel"]');
    expect(weekPanel.text()).toContain('Meta Semanal Presidencia');

    // 3. Cambiar a vista Día y crear anotación Diaria
    await wrapper.find('[data-testid="view-btn-day"]').trigger('click');
    await wrapper.find('[data-testid="add-day-note-btn"]').trigger('click');
    expect(wrapper.find('[data-testid="note-scope-select"]').element.value).toBe('day');
    expect(wrapper.find('[data-testid="note-date-input"]').element.value).toBe(todayStr);

    await wrapper.find('[data-testid="note-title-input"]').setValue('Reunión Junta Directiva');
    await wrapper.find('[data-testid="note-content-input"]').setValue('Preparar KPIs de ventas');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    const daySection = wrapper.find('[data-testid="calendar-day-notes-section"]');
    expect(daySection.text()).toContain('Reunión Junta Directiva');
    expect(daySection.text()).toContain('Meta Semanal Presidencia');
    expect(daySection.text()).toContain('Cierre Contable Nova Work');

    // 4. Editar anotación diaria haciendo clic en ella
    const dayCard = daySection
      .findAll('[data-testid="calendar-note-item"]')
      .find((b) => b.text().includes('Reunión Junta Directiva'));
    await dayCard.trigger('click');
    await wrapper.find('[data-testid="note-title-input"]').setValue('Reunión Junta Editada');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.find('[data-testid="calendar-day-notes-section"]').text()).toContain('Reunión Junta Editada');
    expect(wrapper.find('[data-testid="calendar-day-notes-section"]').text()).not.toContain('Reunión Junta Directiva');

    // 5. Eliminar anotación usando confirmación inline en modal
    const editedCard = wrapper
      .find('[data-testid="calendar-day-notes-section"]')
      .findAll('[data-testid="calendar-note-item"]')
      .find((b) => b.text().includes('Reunión Junta Editada'));
    await editedCard.trigger('click');

    await wrapper.find('[data-testid="delete-note-btn"]').trigger('click');
    await wrapper.find('[data-testid="confirm-delete-note-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="calendar-day-notes-section"]').text()).not.toContain('Reunión Junta Editada');
    expect(mockState.calendarNotes).toHaveLength(2);
  });

  it('persists calendar notes in localStorage across remounts when calendar_notes table is absent', async () => {
    mockState.simulateMissingNotesTable = true;

    const wrapper1 = mountCalendar();
    await flushPromises();

    await wrapper1.find('[data-testid="add-calendar-note-btn"]').trigger('click');
    await wrapper1.find('[data-testid="note-scope-select"]').setValue('day');
    await wrapper1.find('[data-testid="note-title-input"]').setValue('Nota Persistente Nova');
    await wrapper1.find('[data-testid="note-content-input"]').setValue('Disponible sin migración SQL');
    await wrapper1.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_NOTES_KEY))).toHaveLength(1);

    // Remontar calendario y cambiar a vista Día -> debe seguir visible desde localStorage
    const wrapper2 = mountCalendar();
    await flushPromises();
    await wrapper2.find('[data-testid="view-btn-day"]').trigger('click');

    expect(wrapper2.find('[data-testid="calendar-day-notes-section"]').text()).toContain('Nota Persistente Nova');
  });
});
