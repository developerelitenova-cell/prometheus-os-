/**
 * Cálculo dinámico de avance del proyecto basado en Entregables de Trabajo (EDT).
 * Jerarquía Padre -> Hijo: solo los entregables hoja (sin hijos) se suman al total
 * ponderado para evitar doble contabilización.
 *
 * Fórmula:
 *   Avance (%) = (Suma de pesos de EDT ejecutables en columnas `is_done` / Peso total) * 100
 */

export const DEFAULT_KANBAN_COLUMNS = [
  { key: 'todo', label: 'Por hacer', is_done: false },
  { key: 'in_progress', label: 'En progreso', is_done: false },
  { key: 'in_review', label: 'En revisión', is_done: false },
  { key: 'completed', label: 'Completado', is_done: true },
];

export function getDoneColumnKeys(columns = DEFAULT_KANBAN_COLUMNS) {
  const cols = Array.isArray(columns) && columns.length > 0 ? columns : DEFAULT_KANBAN_COLUMNS;
  const doneKeys = new Set(cols.filter((c) => c.is_done && c.key).map((c) => c.key));
  if (doneKeys.size === 0) doneKeys.add('completed');
  return doneKeys;
}

/**
 * Retorna los nodos hoja (entregables ejecutables que aparecen en el Kanban).
 */
export function getExecutableEdtItems(edtItems = []) {
  const parentIds = new Set(
    (edtItems || []).filter((item) => item.parent_id).map((item) => item.parent_id)
  );
  return (edtItems || []).filter((item) => !parentIds.has(item.id));
}

/**
 * Calcula el avance ponderado del proyecto en porcentaje (0 - 100).
 */
export function calculateProjectProgress(edtItems = [], columns = DEFAULT_KANBAN_COLUMNS) {
  const doneKeys = getDoneColumnKeys(columns);
  const leafItems = getExecutableEdtItems(edtItems);

  let totalWeight = 0;
  let completedWeight = 0;
  let completedCount = 0;

  for (const item of leafItems) {
    const w = Number(item.weight) || 0;
    totalWeight += w;
    if (doneKeys.has(item.status)) {
      completedWeight += w;
      completedCount += 1;
    }
  }

  const percentage = totalWeight > 0 ? Number(((completedWeight / totalWeight) * 100).toFixed(2)) : 0;

  return {
    percentage,
    completedWeight: Number(completedWeight.toFixed(2)),
    totalWeight: Number(totalWeight.toFixed(2)),
    completedCount,
    totalCount: leafItems.length,
  };
}

/**
 * Calcula el porcentaje de peso de un entregable respecto al total del proyecto.
 */
export function getEdtWeightShare(item, totalWeight) {
  if (!totalWeight || totalWeight <= 0) return 0;
  const w = Number(item?.weight) || 0;
  return Number(((w / totalWeight) * 100).toFixed(1));
}

/**
 * Calcula el rollup de avance de una fase padre según sus entregables hijos.
 */
export function calculateParentEdtProgress(parentId, edtItems = [], columns = DEFAULT_KANBAN_COLUMNS) {
  const doneKeys = getDoneColumnKeys(columns);
  const leafItems = getExecutableEdtItems(edtItems).filter((item) => item.parent_id === parentId);

  let totalWeight = 0;
  let completedWeight = 0;
  for (const child of leafItems) {
    const w = Number(child.weight) || 0;
    totalWeight += w;
    if (doneKeys.has(child.status)) {
      completedWeight += w;
    }
  }

  return {
    percentage: totalWeight > 0 ? Number(((completedWeight / totalWeight) * 100).toFixed(1)) : 0,
    completedWeight: Number(completedWeight.toFixed(2)),
    totalWeight: Number(totalWeight.toFixed(2)),
    totalChildren: leafItems.length,
    completedChildren: leafItems.filter((c) => doneKeys.has(c.status)).length,
  };
}

