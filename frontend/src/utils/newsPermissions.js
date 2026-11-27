/**
 * Utilidades compartidas para permisos de publicación y filtrado
 * de noticias y comunicados internos en Nova Work.
 */

const VALID_PERMISSIONS = ['none', 'area', 'company'];

export const NEWS_PERMISSION_OPTIONS = [
  {
    value: 'none',
    label: 'Sin permiso de publicación',
    shortLabel: 'Sin permiso',
    description: 'Solo visualiza comunicados en su portal.',
  },
  {
    value: 'area',
    label: 'Publicar a su Equipo / Área',
    shortLabel: 'Noticias: Área',
    description: 'Puede emitir comunicados y flyers exclusivos para su departamento.',
  },
  {
    value: 'company',
    label: 'Publicar a Toda la Empresa',
    shortLabel: 'Noticias: Empresa',
    description: 'Puede emitir comunicados globales o por área (RRHH, KPIs, Presidencia).',
  },
];

export const NEWS_CATEGORY_OPTIONS = [
  {
    value: 'corporate',
    label: 'Corporativo',
    badgeClass: 'bg-[#b08d57]/15 text-[#8a6d3d] border-[#b08d57]/30',
    icon: 'campaign',
  },
  {
    value: 'kpi',
    label: 'Indicadores / KPIs',
    badgeClass: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    icon: 'monitoring',
  },
  {
    value: 'area',
    label: 'Mi Departamento',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    icon: 'groups',
  },
];

/**
 * Resuelve el permiso efectivo de publicación de noticias para un perfil.
 * @param {object|null|undefined} profile
 * @returns {'company'|'area'|'none'}
 */
export function getEffectiveNewsPermission(profile) {
  if (!profile) return 'none';
  if (profile.is_master_admin) return 'company';

  if (
    profile.news_permission !== null &&
    profile.news_permission !== undefined &&
    VALID_PERMISSIONS.includes(profile.news_permission)
  ) {
    return profile.news_permission;
  }

  // Fallback pre-migración cuando news_permission aún es null/undefined
  const roleName = (profile.roles?.name || '').toLowerCase();
  if (
    roleName.includes('gestión humana') ||
    roleName.includes('gestion humana') ||
    roleName.includes('recursos humanos') ||
    roleName.includes('analista de datos') ||
    roleName.includes('especialista de datos') ||
    roleName.includes('datos')
  ) {
    return 'company';
  }

  if ([1, 2].includes(profile.roles?.access_level)) {
    return 'area';
  }

  return 'none';
}

export function canPublishNews(profile) {
  return getEffectiveNewsPermission(profile) !== 'none';
}

export function canPublishCompanyNews(profile) {
  return getEffectiveNewsPermission(profile) === 'company';
}

export function canPublishAreaNews(profile) {
  const perm = getEffectiveNewsPermission(profile);
  return perm === 'area' || perm === 'company';
}

/**
 * Filtra los comunicados visibles para el usuario autenticado según alcance y área.
 * @param {Array<object>} newsList
 * @param {object|null|undefined} profile
 * @returns {Array<object>}
 */
export function filterVisibleNews(newsList, profile) {
  if (!Array.isArray(newsList)) return [];

  const myAreaId = profile?.roles?.area_id || profile?.area_id || null;
  const myId = profile?.id || null;
  const isMasterAdmin = Boolean(profile?.is_master_admin);

  return newsList.filter((item) => {
    if (!item) return false;
    if (isMasterAdmin) return true;
    if (!item.scope || item.scope === 'company') return true;
    if (item.scope === 'area' && item.area_id && myAreaId && item.area_id === myAreaId) {
      return true;
    }
    if (item.created_by && myId && item.created_by === myId) {
      return true;
    }
    return false;
  });
}

/**
 * Obtiene la metadata visual de categoría para una noticia/comunicado.
 * @param {object|null|undefined} news
 * @returns {{ value: string, label: string, badgeClass: string, icon: string }}
 */
export function getNewsCategoryMeta(news) {
  if (news?.category) {
    const match = NEWS_CATEGORY_OPTIONS.find((opt) => opt.value === news.category);
    if (match) return match;
  }

  const fallbackValue = news?.scope === 'area' ? 'area' : 'corporate';
  return (
    NEWS_CATEGORY_OPTIONS.find((opt) => opt.value === fallbackValue) ||
    NEWS_CATEGORY_OPTIONS[0]
  );
}
