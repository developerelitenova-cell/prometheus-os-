/**
 * Utilidades para serializar, deserializar y formatear múltiples evidencias fotográficas
 * manteniendo compatibilidad hacia atrás con la columna `evidence_photo TEXT`.
 */

export const MAX_EVIDENCE_PHOTOS = 5;

/**
 * Convierte el valor crudo de `evidence_photo` (string URL/Base64, JSON array string o Array)
 * en un arreglo limpio de URLs/DataURIs válidas.
 */
export function parseEvidencePhotos(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof raw !== 'string') return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [trimmed];
}

/**
 * Serializa un arreglo (o valor único) de fotos para almacenamiento compatible con `TEXT`:
 * - 0 fotos -> `null`
 * - 1 foto  -> string directo (compatibilidad total con registros legacy)
 * - 2..N    -> JSON array string limitado a `MAX_EVIDENCE_PHOTOS`
 */
export function serializeEvidencePhotos(photos) {
  const normalized = parseEvidencePhotos(photos).slice(0, MAX_EVIDENCE_PHOTOS);
  if (normalized.length === 0) return null;
  if (normalized.length === 1) return normalized[0];
  return JSON.stringify(normalized);
}

/**
 * Retorna la cantidad de fotos de evidencia contenidas en el valor crudo.
 */
export function countEvidencePhotos(raw) {
  return parseEvidencePhotos(raw).length;
}

/**
 * Retorna etiqueta legible según la cantidad de capturas adjuntas.
 */
export function formatEvidencePhotoLabel(raw) {
  const count = countEvidencePhotos(raw);
  if (count === 0) return '';
  if (count === 1) return '1 captura adjunta';
  return `${count} capturas adjuntas`;
}
