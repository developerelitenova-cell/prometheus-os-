/**
 * Utilidades visuales consistentes para prioridades y exigencia de evidencia
 * en todas las capas de actividades de "Mi Portal" (Nova Work).
 */

const PRIORITY_MAP = {
  urgent: {
    key: 'urgent',
    label: 'Urgente',
    shortLabel: 'Urgente',
    icon: 'priority_high',
    rank: 0,
    classes: 'bg-red-600 text-white border border-red-700 shadow-2xs',
  },
  high: {
    key: 'high',
    label: 'Alta',
    shortLabel: 'Alta',
    icon: 'keyboard_double_arrow_up',
    rank: 1,
    classes: 'bg-orange-50 text-orange-700 border border-orange-200',
  },
  medium: {
    key: 'medium',
    label: 'Media',
    shortLabel: 'Media',
    icon: 'remove',
    rank: 2,
    classes: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  low: {
    key: 'low',
    label: 'Baja',
    shortLabel: 'Baja',
    icon: 'keyboard_arrow_down',
    rank: 3,
    classes: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

export function getPriorityBadge(priority) {
  const normalized = String(priority || 'medium').trim().toLowerCase();
  return PRIORITY_MAP[normalized] || PRIORITY_MAP.medium;
}

const EVIDENCE_MAP = {
  photo_required: {
    key: 'photo_required',
    label: 'Evidencia Obligatoria · Foto',
    shortLabel: 'Obligatoria (Foto)',
    icon: 'photo_camera',
    mandatory: true,
    testId: 'evidence-badge-mandatory',
    tooltip: 'Debes adjuntar foto/pantallazo y descripción antes de finalizar.',
    classes: 'bg-red-50 text-red-700 border border-red-200',
  },
  text_only: {
    key: 'text_only',
    label: 'Evidencia Obligatoria · Nota',
    shortLabel: 'Obligatoria (Nota)',
    icon: 'edit_note',
    mandatory: true,
    testId: 'evidence-badge-mandatory',
    tooltip: 'Debes escribir un resumen o soporte en texto antes de finalizar.',
    classes: 'bg-amber-50 text-amber-800 border border-amber-300',
  },
  none: {
    key: 'none',
    label: 'Evidencia Opcional',
    shortLabel: 'Opcional',
    icon: 'check_circle',
    mandatory: false,
    testId: 'evidence-badge-optional',
    tooltip: 'Verificación directa: el texto y la foto son opcionales.',
    classes: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
};

export function getEvidenceBadge(evidenceRequirement) {
  const normalized = String(evidenceRequirement || 'none').trim().toLowerCase();
  return EVIDENCE_MAP[normalized] || EVIDENCE_MAP.none;
}
