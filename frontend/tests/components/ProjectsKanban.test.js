import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ProjectsKanban from '../../src/views/ProjectsKanban.vue';
import { DEFAULT_KANBAN_COLUMNS } from '../../src/utils/projectProgress';

const mockState = {
  projects: [
    {
      id: 'prj_1',
      code: 'PRJ-01',
      name: 'Expansión Planta Sur',
      description: 'Proyecto de infraestructura',
      kanban_columns: DEFAULT_KANBAN_COLUMNS,
      progress_percentage: 0,
      areas: { name: 'Operaciones' },
    },
  ],
  edtItems: [
    {
      id: 'phase_1',
      project_id: 'prj_1',
      parent_id: null,
      edt_code: '1.0',
      title: 'Fase Ingeniería',
      status: 'todo',
      weight: 100,
      assignee_id: 'emp_1',
      priority: 'high',
      position: 0,
    },
    {
      id: 'edt_1',
      project_id: 'prj_1',
      parent_id: 'phase_1',
      edt_code: '1.1',
      title: 'Planos estructurales',
      status: 'todo',
      weight: 25,
      assignee_id: 'emp_1',
      due_date: '2026-12-01',
      priority: 'high',
      position: 1,
    },
    {
      id: 'edt_2',
      project_id: 'prj_1',
      parent_id: 'phase_1',
      edt_code: '1.2',
      title: 'Instalación eléctrica',
      status: 'in_progress',
      weight: 75,
      assignee_id: 'emp_2',
      due_date: '2026-12-15',
      priority: 'urgent',
      position: 2,
    },
  ],
  profiles: [
    { id: 'emp_1', full_name: 'Ana Pérez' },
    { id: 'emp_2', full_name: 'Carlos Ruiz' },
  ],
  areas: [{ id: 'area_1', name: 'Operaciones' }],
};

vi.mock('../../src/api/auth', () => ({
  currentProfile: {
    value: {
      id: 'admin_1',
      full_name: 'Admin',
      is_master_admin: true,
      roles: { access_level: 1 },
    },
  },
  loadCurrentProfile: vi.fn(),
}));

const updateCalls = [];

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn((table) => {
      const makeChain = () => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          single: vi.fn(() => chain),
        };
        if (table === 'projects') chain.then = (cb) => cb({ data: mockState.projects, error: null });
        else if (table === 'project_edt_items') chain.then = (cb) => cb({ data: mockState.edtItems, error: null });
        else if (table === 'profiles') chain.then = (cb) => cb({ data: mockState.profiles, error: null });
        else if (table === 'areas') chain.then = (cb) => cb({ data: mockState.areas, error: null });
        else chain.then = (cb) => cb({ data: [], error: null });
        return chain;
      };

      return {
        select: vi.fn(() => makeChain()),
        update: vi.fn((payload) => ({
          eq: vi.fn((_col, id) => {
            updateCalls.push({ table, id, payload });
            return Promise.resolve({ data: [payload], error: null });
          }),
        })),
      };
    }),
  },
}));

describe('ProjectsKanban.vue (Tablero Kanban & Cálculo Dinámico EDT)', () => {
  beforeEach(() => {
    updateCalls.length = 0;
    mockState.edtItems[1].status = 'todo';
    mockState.edtItems[2].status = 'in_progress';
  });

  it('transitions EDT cards via drag-and-drop and selector, recalculating weighted project progress accurately', async () => {
    const wrapper = mount(ProjectsKanban);
    await flushPromises();

    // Inicial: 0% (0 / 100 pts)
    expect(wrapper.find('[data-testid="project-progress-text"]').text()).toBe('0%');
    expect(wrapper.find('[data-testid="kanban-column-todo"]').text()).toContain('Planos estructurales');
    expect(wrapper.find('[data-testid="kanban-column-in_progress"]').text()).toContain('Instalación eléctrica');

    // 1. Simular Drag & Drop de edt_1 (peso 25) desde "Por hacer" hacia columna "Completado"
    const cardEl = wrapper.find('[data-testid="edt-card-edt_1"]');
    const completedCol = wrapper.find('[data-testid="kanban-column-completed"]');

    await cardEl.trigger('dragstart');
    await completedCol.trigger('drop');
    await flushPromises();

    // Debe actualizar optimistamente el progreso a 25% (25 / 100 pts) y persistir
    expect(wrapper.find('[data-testid="project-progress-text"]').text()).toBe('25%');
    expect(wrapper.find('[data-testid="kanban-column-completed"]').text()).toContain('Planos estructurales');
    expect(updateCalls.some((c) => c.table === 'project_edt_items' && c.id === 'edt_1' && c.payload.status === 'completed')).toBe(true);
    expect(updateCalls.some((c) => c.table === 'projects' && c.payload.progress_percentage === 25)).toBe(true);

    // 2. Transicionar edt_2 (peso 75) a "completed" -> progreso debe subir a 100%
    await wrapper.find('[data-testid="card-status-select-edt_2"]').setValue('completed');
    await flushPromises();
    expect(wrapper.find('[data-testid="project-progress-text"]').text()).toBe('100%');

    // 3. Devolver edt_1 (peso 25) a "in_review" -> progreso debe bajar exactamente a 75%
    await wrapper.find('[data-testid="card-status-select-edt_1"]').setValue('in_review');
    await flushPromises();
    expect(wrapper.find('[data-testid="project-progress-text"]').text()).toBe('75%');

    // 4. Cambiar a pestaña Estructura EDT (Padre -> Hijo) y verificar jerarquía y rollup
    await wrapper.find('[data-testid="tab-edt"]').trigger('click');
    const hierarchyView = wrapper.find('[data-testid="edt-hierarchy-view"]');
    expect(hierarchyView.exists()).toBe(true);
    expect(hierarchyView.text()).toContain('Fase Ingeniería');
    expect(hierarchyView.text()).toContain('75%');
  });
});

