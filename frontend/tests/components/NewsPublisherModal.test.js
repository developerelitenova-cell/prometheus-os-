import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import NewsPublisherModal from '../../src/components/NewsPublisherModal.vue';

const {
  insertMock,
  deleteEqMock,
  uploadMock,
  getPublicUrlMock,
  state,
} = vi.hoisted(() => ({
  insertMock: vi.fn(),
  deleteEqMock: vi.fn(),
  uploadMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
  state: {
    recentNewsRows: [],
    areasRows: [
      { id: 'area-comercial', name: 'Comercial' },
      { id: 'area-logistica', name: 'Logística' },
      { id: 'area-rrhh', name: 'Gestión Humana' },
    ],
  },
}));

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'areas') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({ data: state.areasRows, error: null })),
          })),
        };
      }
      if (table === 'corporate_news') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({ data: state.recentNewsRows, error: null })),
            })),
          })),
          insert: insertMock,
          delete: vi.fn(() => ({
            eq: deleteEqMock,
          })),
        };
      }
      return {
        select: vi.fn(() => ({ data: [], error: null })),
      };
    }),
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      })),
    },
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'auth-fallback-uid' } } })),
    },
  },
}));

const AREAS = [
  { id: 'area-comercial', name: 'Comercial' },
  { id: 'area-logistica', name: 'Logística' },
  { id: 'area-rrhh', name: 'Gestión Humana' },
];

const MANAGER_PROFILE = {
  id: 'u-mgr-1',
  full_name: 'Carlos Gerente',
  news_permission: 'area',
  roles: {
    name: 'Gerente Comercial',
    access_level: 1,
    area_id: 'area-comercial',
    areas: { name: 'Comercial' },
  },
};

const KPI_ANALYST_PROFILE = {
  id: 'u-kpi-1',
  full_name: 'Laura Datos',
  news_permission: 'company',
  roles: {
    name: 'Analista de Datos',
    access_level: 3,
    area_id: 'area-rrhh',
    areas: { name: 'Gestión Humana' },
  },
};

const REGULAR_EMPLOYEE_PROFILE = {
  id: 'u-emp-1',
  full_name: 'Pedro Colaborador',
  news_permission: 'none',
  roles: {
    name: 'Auxiliar',
    access_level: 3,
    area_id: 'area-logistica',
    areas: { name: 'Logística' },
  },
};

describe('NewsPublisherModal.vue', () => {
  const mountedWrappers = [];

  beforeEach(() => {
    vi.clearAllMocks();
    state.recentNewsRows = [];
    insertMock.mockResolvedValue({ data: null, error: null });
    deleteEqMock.mockResolvedValue({ error: null });
    uploadMock.mockResolvedValue({ data: { path: 'flyers/mock.png' }, error: null });
    getPublicUrlMock.mockImplementation((filePath) => ({
      data: { publicUrl: `https://cdn.novawork.local/news_flyers/${filePath}` },
    }));
  });

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop().unmount();
    }
  });

  const mountModal = (props = {}) => {
    const wrapper = mount(NewsPublisherModal, {
      props: {
        modelValue: true,
        profile: MANAGER_PROFILE,
        areas: AREAS,
        defaultCategory: 'area',
        ...props,
      },
    });
    mountedWrappers.push(wrapper);
    return wrapper;
  };

  it('does not render when modelValue is false', () => {
    const wrapper = mountModal({ modelValue: false });
    expect(wrapper.find('[data-testid="news-publisher-modal"]').exists()).toBe(false);
  });

  it('shows no-permission notice for users with news_permission = none', async () => {
    const wrapper = mountModal({ profile: REGULAR_EMPLOYEE_PROFILE });
    await flushPromises();

    expect(wrapper.find('[data-testid="no-news-permission"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="news-submit-btn"]').exists()).toBe(false);
  });

  it('locks scope and area for an area-only manager and publishes with area payload', async () => {
    const wrapper = mountModal({ profile: MANAGER_PROFILE, defaultCategory: 'area' });
    await flushPromises();

    expect(wrapper.find('[data-testid="scope-company-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="scope-area-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="locked-area-badge"]').text()).toContain('Comercial');

    await wrapper.find('[data-testid="news-title-input"]').setValue('Meta semanal del equipo');
    await wrapper.find('[data-testid="news-body-input"]').setValue('Reunión de cierre comercial a las 4pm.');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'Meta semanal del equipo',
      body: 'Reunión de cierre comercial a las 4pm.',
      image_url: null,
      scope: 'area',
      area_id: 'area-comercial',
      category: 'area',
      author_name: 'Carlos Gerente',
      created_by: 'u-mgr-1',
    });

    expect(wrapper.find('[data-testid="news-success"]').exists()).toBe(true);
    expect(wrapper.emitted('published')).toBeTruthy();
    expect(wrapper.emitted('published')[0][0]).toMatchObject({
      scope: 'area',
      area_id: 'area-comercial',
    });
  });

  it('allows company-wide publishers (HR / KPI Analyst) to publish company-wide or to a chosen area', async () => {
    const wrapper = mountModal({ profile: KPI_ANALYST_PROFILE, defaultCategory: 'kpi' });
    await flushPromises();

    expect(wrapper.find('[data-testid="scope-company-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="scope-area-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="locked-area-badge"]').exists()).toBe(false);

    // 1. Company-wide KPI announcement
    await wrapper.find('[data-testid="news-title-input"]').setValue('Resultados KPIs Semana 2');
    await wrapper.find('[data-testid="news-body-input"]').setValue('Cumplimiento global alcanzó 94%.');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      title: 'Resultados KPIs Semana 2',
      scope: 'company',
      area_id: null,
      category: 'kpi',
      author_name: 'Laura Datos',
      created_by: 'u-kpi-1',
    });

    // 2. Switch to specific area and publish
    await wrapper.find('[data-testid="scope-area-btn"]').trigger('click');
    const areaSelect = wrapper.find('[data-testid="news-area-select"]');
    expect(areaSelect.exists()).toBe(true);
    await areaSelect.setValue('area-logistica');

    await wrapper.find('[data-testid="news-title-input"]').setValue('Alerta entregas Logística');
    await wrapper.find('[data-testid="news-body-input"]').setValue('Revisar despachos prioritarios.');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertMock.mock.calls[1][0]).toMatchObject({
      title: 'Alerta entregas Logística',
      scope: 'area',
      area_id: 'area-logistica',
      category: 'kpi',
    });
  });

  it('validates title and requires either body or flyer image before publishing', async () => {
    const wrapper = mountModal({ profile: KPI_ANALYST_PROFILE, defaultCategory: 'corporate' });
    await flushPromises();

    // Missing title
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[data-testid="news-error"]').text()).toContain('título');
    expect(insertMock).not.toHaveBeenCalled();

    // Title provided, but neither body nor image
    await wrapper.find('[data-testid="news-title-input"]').setValue('Comunicado sin contenido');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[data-testid="news-error"]').text()).toContain('mensaje');
    expect(insertMock).not.toHaveBeenCalled();

    // Attach a flyer image without body -> should succeed
    const fileInput = wrapper.find('[data-testid="news-file-input"]');
    const mockFile = new File(['png-bytes'], 'flyer.png', { type: 'image/png' });
    Object.defineProperty(fileInput.element, 'files', {
      value: [mockFile],
      configurable: true,
    });
    await fileInput.trigger('change');

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      title: 'Comunicado sin contenido',
      body: null,
      scope: 'company',
    });
    expect(insertMock.mock.calls[0][0].image_url).toContain('https://cdn.novawork.local/news_flyers/flyers/');
  });

  it('falls back to legacy corporate_news payload when new columns are not yet migrated', async () => {
    insertMock
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST204', message: "Could not find the 'body' column of 'corporate_news' in the schema cache" },
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const wrapper = mountModal({ profile: KPI_ANALYST_PROFILE, defaultCategory: 'corporate' });
    await flushPromises();

    await wrapper.find('[data-testid="news-title-input"]').setValue('Aviso Legacy');
    await wrapper.find('[data-testid="news-body-input"]').setValue('Texto de prueba');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertMock.mock.calls[1][0]).toMatchObject({
      title: 'Aviso Legacy',
      image_url: '',
      created_by: 'u-kpi-1',
    });
    expect(wrapper.find('[data-testid="news-success"]').exists()).toBe(true);
    expect(wrapper.emitted('published')).toBeTruthy();
  });

  it('renders recent news list and deletes an item when delete button is clicked', async () => {
    state.recentNewsRows = [
      {
        id: 'news-1',
        title: 'Comunicado del Área',
        body: 'Detalle interno',
        scope: 'area',
        area_id: 'area-comercial',
        category: 'area',
        created_by: 'u-mgr-1',
      },
      {
        id: 'news-other',
        title: 'Comunicado de otra área',
        body: 'No debería mostrarse al gerente comercial',
        scope: 'area',
        area_id: 'area-logistica',
        category: 'area',
        created_by: 'u-mgr-2',
      },
    ];

    const wrapper = mountModal({ profile: MANAGER_PROFILE });
    await flushPromises();

    const list = wrapper.find('[data-testid="recent-news-list"]');
    expect(list.exists()).toBe(true);
    expect(list.text()).toContain('Comunicado del Área');
    expect(list.text()).not.toContain('Comunicado de otra área');

    await wrapper.find('[data-testid="delete-news-btn"]').trigger('click');
    await flushPromises();

    expect(deleteEqMock).toHaveBeenCalledWith('id', 'news-1');
    expect(wrapper.emitted('published')).toBeTruthy();
    expect(wrapper.emitted('published')[0][0]).toEqual({ deletedId: 'news-1' });
  });
});
