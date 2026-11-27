import { describe, it, expect } from 'vitest';
import {
  NEWS_PERMISSION_OPTIONS,
  NEWS_CATEGORY_OPTIONS,
  getEffectiveNewsPermission,
  canPublishNews,
  canPublishCompanyNews,
  canPublishAreaNews,
  filterVisibleNews,
  getNewsCategoryMeta,
} from '../../src/utils/newsPermissions';

describe('newsPermissions constants', () => {
  it('exports all three permission options with expected values', () => {
    expect(NEWS_PERMISSION_OPTIONS.map((o) => o.value)).toEqual(['none', 'area', 'company']);
    for (const opt of NEWS_PERMISSION_OPTIONS) {
      expect(opt.label).toBeTruthy();
      expect(opt.shortLabel).toBeTruthy();
      expect(opt.description).toBeTruthy();
    }
  });

  it('exports corporate, kpi, and area category options with badge styles and icons', () => {
    expect(NEWS_CATEGORY_OPTIONS.map((o) => o.value)).toEqual(['corporate', 'kpi', 'area']);
    for (const opt of NEWS_CATEGORY_OPTIONS) {
      expect(opt.label).toBeTruthy();
      expect(opt.badgeClass).toBeTruthy();
      expect(opt.icon).toBeTruthy();
    }
  });
});

describe('getEffectiveNewsPermission & helper guards', () => {
  it('returns none for null or undefined profile', () => {
    expect(getEffectiveNewsPermission(null)).toBe('none');
    expect(getEffectiveNewsPermission(undefined)).toBe('none');
    expect(canPublishNews(null)).toBe(false);
    expect(canPublishAreaNews(null)).toBe(false);
    expect(canPublishCompanyNews(null)).toBe(false);
  });

  it('always returns company for master admins regardless of news_permission', () => {
    const master = {
      id: 'u-master',
      is_master_admin: true,
      news_permission: 'none',
      roles: { name: 'Colaborador', access_level: 3 },
    };
    expect(getEffectiveNewsPermission(master)).toBe('company');
    expect(canPublishNews(master)).toBe(true);
    expect(canPublishAreaNews(master)).toBe(true);
    expect(canPublishCompanyNews(master)).toBe(true);
  });

  it('respects explicit news_permission values over role-based fallback', () => {
    const elevatedEmployee = {
      id: 'u-1',
      news_permission: 'company',
      roles: { name: 'Asistente Administrativo', access_level: 3 },
    };
    expect(getEffectiveNewsPermission(elevatedEmployee)).toBe('company');

    const revokedHr = {
      id: 'u-2',
      news_permission: 'none',
      roles: { name: 'Gerente de Gestión Humana', access_level: 1 },
    };
    expect(getEffectiveNewsPermission(revokedHr)).toBe('none');
    expect(canPublishNews(revokedHr)).toBe(false);

    const areaEmployee = {
      id: 'u-3',
      news_permission: 'area',
      roles: { name: 'Auxiliar Operativo', access_level: 3 },
    };
    expect(getEffectiveNewsPermission(areaEmployee)).toBe('area');
    expect(canPublishNews(areaEmployee)).toBe(true);
    expect(canPublishAreaNews(areaEmployee)).toBe(true);
    expect(canPublishCompanyNews(areaEmployee)).toBe(false);
  });

  it('falls back to company for HR and Data/KPI roles when news_permission is unset or invalid', () => {
    const hrAccented = { roles: { name: 'Líder de Gestión Humana', access_level: 2 } };
    const hrUnaccented = { news_permission: null, roles: { name: 'Analista de Gestion Humana', access_level: 3 } };
    const rrhh = { news_permission: undefined, roles: { name: 'Coordinador Recursos Humanos', access_level: 2 } };
    const kpiAnalyst = { roles: { name: 'Analista de Datos y KPIs', access_level: 3 } };
    const dataSpecialist = { roles: { name: 'Especialista de Datos', access_level: 3 } };
    const invalidPerm = { news_permission: 'invalid_value', roles: { name: 'Ingeniero de Datos', access_level: 3 } };

    expect(getEffectiveNewsPermission(hrAccented)).toBe('company');
    expect(getEffectiveNewsPermission(hrUnaccented)).toBe('company');
    expect(getEffectiveNewsPermission(rrhh)).toBe('company');
    expect(getEffectiveNewsPermission(kpiAnalyst)).toBe('company');
    expect(getEffectiveNewsPermission(dataSpecialist)).toBe('company');
    expect(getEffectiveNewsPermission(invalidPerm)).toBe('company');
  });

  it('falls back to area for managers and leaders (access_level 1 or 2) when news_permission is unset', () => {
    const manager = { roles: { name: 'Gerente Comercial', access_level: 1 } };
    const leader = { news_permission: null, roles: { name: 'Líder de Logística', access_level: 2 } };

    expect(getEffectiveNewsPermission(manager)).toBe('area');
    expect(getEffectiveNewsPermission(leader)).toBe('area');
    expect(canPublishAreaNews(manager)).toBe(true);
    expect(canPublishCompanyNews(manager)).toBe(false);
  });

  it('falls back to none for regular employees (access_level 3 or missing role)', () => {
    const employee = { roles: { name: 'Ejecutivo Comercial', access_level: 3 } };
    const noRole = { id: 'u-norole' };

    expect(getEffectiveNewsPermission(employee)).toBe('none');
    expect(getEffectiveNewsPermission(noRole)).toBe('none');
    expect(canPublishNews(employee)).toBe(false);
  });
});

describe('filterVisibleNews', () => {
  const newsItems = [
    { id: 'n-company', title: 'Global', scope: 'company', area_id: null, created_by: 'u-hr' },
    { id: 'n-legacy', title: 'Legacy without scope', created_by: 'u-hr' },
    { id: 'n-area-a', title: 'Área A', scope: 'area', area_id: 'area-a', created_by: 'u-mgr-a' },
    { id: 'n-area-b', title: 'Área B', scope: 'area', area_id: 'area-b', created_by: 'u-mgr-b' },
    { id: 'n-own-other', title: 'Propia en otra área', scope: 'area', area_id: 'area-c', created_by: 'u-emp-a' },
    null,
  ];

  it('returns empty array for non-array input', () => {
    expect(filterVisibleNews(null, { id: 'u-1' })).toEqual([]);
    expect(filterVisibleNews(undefined, { id: 'u-1' })).toEqual([]);
  });

  it('shows company, legacy, own-area, and self-created news to regular employee', () => {
    const empA = {
      id: 'u-emp-a',
      roles: { area_id: 'area-a', access_level: 3 },
    };
    const visible = filterVisibleNews(newsItems, empA).map((n) => n.id);
    expect(visible).toEqual(['n-company', 'n-legacy', 'n-area-a', 'n-own-other']);
    expect(visible).not.toContain('n-area-b');
  });

  it('supports fallback profile.area_id when roles.area_id is absent', () => {
    const empB = { id: 'u-emp-b', area_id: 'area-b' };
    const visible = filterVisibleNews(newsItems, empB).map((n) => n.id);
    expect(visible).toEqual(['n-company', 'n-legacy', 'n-area-b']);
  });

  it('shows all non-null news items to master admins', () => {
    const master = { id: 'u-master', is_master_admin: true, roles: { area_id: 'area-z' } };
    const visible = filterVisibleNews(newsItems, master).map((n) => n.id);
    expect(visible).toEqual(['n-company', 'n-legacy', 'n-area-a', 'n-area-b', 'n-own-other']);
  });
});

describe('getNewsCategoryMeta', () => {
  it('returns exact metadata for corporate, kpi, and area categories', () => {
    expect(getNewsCategoryMeta({ category: 'corporate' }).label).toBe('Corporativo');
    expect(getNewsCategoryMeta({ category: 'kpi' }).label).toBe('Indicadores / KPIs');
    expect(getNewsCategoryMeta({ category: 'kpi' }).icon).toBe('monitoring');
    expect(getNewsCategoryMeta({ category: 'area' }).label).toBe('Mi Departamento');
    expect(getNewsCategoryMeta({ category: 'area' }).icon).toBe('groups');
  });

  it('falls back based on scope when category is missing or unknown', () => {
    expect(getNewsCategoryMeta({ scope: 'area' }).value).toBe('area');
    expect(getNewsCategoryMeta({ category: 'unknown', scope: 'area' }).value).toBe('area');
    expect(getNewsCategoryMeta({ scope: 'company' }).value).toBe('corporate');
    expect(getNewsCategoryMeta(null).value).toBe('corporate');
    expect(getNewsCategoryMeta(undefined).value).toBe('corporate');
  });
});
