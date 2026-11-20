import { getPriorityBadge, getEvidenceBadge } from './taskBadges';
import { countEvidencePhotos } from './evidencePhotos';

const textEncoder = new TextEncoder();

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeXml(str) {
  return String(str ?? '')
    // Eliminar caracteres de control inválidos en XML 1.0
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Generador ZIP (Store método 0) + CRC32 IEEE 802.3 ────────────────────────
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildZipUint8Array(entries) {
  const prepared = [];
  let localTotalSize = 0;
  let centralTotalSize = 0;

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(String(entry.name || 'file'));
    const dataBytes =
      entry.data instanceof Uint8Array
        ? entry.data
        : textEncoder.encode(String(entry.data ?? ''));
    const crc = computeCrc32(dataBytes);
    const localOffset = localTotalSize;

    prepared.push({ nameBytes, dataBytes, crc, localOffset });
    localTotalSize += 30 + nameBytes.length + dataBytes.length;
    centralTotalSize += 46 + nameBytes.length;
  }

  const totalSize = localTotalSize + centralTotalSize + 22;
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  let pos = 0;

  // 1. Local File Headers + File Data
  for (const item of prepared) {
    view.setUint32(pos, 0x04034b50, true);
    view.setUint16(pos + 4, 20, true); // Version needed
    view.setUint16(pos + 6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(pos + 8, 0, true); // Compression: Store (0)
    view.setUint16(pos + 10, 0, true); // Mod time
    view.setUint16(pos + 12, 0x5421, true); // Mod date
    view.setUint32(pos + 14, item.crc, true);
    view.setUint32(pos + 18, item.dataBytes.length, true);
    view.setUint32(pos + 22, item.dataBytes.length, true);
    view.setUint16(pos + 26, item.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true); // Extra len
    pos += 30;

    out.set(item.nameBytes, pos);
    pos += item.nameBytes.length;
    out.set(item.dataBytes, pos);
    pos += item.dataBytes.length;
  }

  // 2. Central Directory Headers
  const centralStartOffset = pos;
  for (const item of prepared) {
    view.setUint32(pos, 0x02014b50, true);
    view.setUint16(pos + 4, 20, true); // Version made by
    view.setUint16(pos + 6, 20, true); // Version needed
    view.setUint16(pos + 8, 0x0800, true); // UTF-8
    view.setUint16(pos + 10, 0, true); // Store
    view.setUint16(pos + 12, 0, true); // Mod time
    view.setUint16(pos + 14, 0x5421, true); // Mod date
    view.setUint32(pos + 16, item.crc, true);
    view.setUint32(pos + 20, item.dataBytes.length, true);
    view.setUint32(pos + 24, item.dataBytes.length, true);
    view.setUint16(pos + 28, item.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true); // Extra len
    view.setUint16(pos + 32, 0, true); // Comment len
    view.setUint16(pos + 34, 0, true); // Disk start
    view.setUint16(pos + 36, 0, true); // Internal attrs
    view.setUint32(pos + 38, 0, true); // External attrs
    view.setUint32(pos + 42, item.localOffset, true);
    pos += 46;

    out.set(item.nameBytes, pos);
    pos += item.nameBytes.length;
  }

  // 3. End of Central Directory Record
  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 4, 0, true);
  view.setUint16(pos + 6, 0, true);
  view.setUint16(pos + 8, prepared.length, true);
  view.setUint16(pos + 10, prepared.length, true);
  view.setUint32(pos + 12, centralTotalSize, true);
  view.setUint32(pos + 16, centralStartOffset, true);
  view.setUint16(pos + 20, 0, true);

  return out;
}

// ── Generador OOXML (.xlsx) ──────────────────────────────────────────────────
function colLetter(colIdxZeroBased) {
  let n = colIdxZeroBased + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function sanitizeSheetName(name, fallbackIdx = 1) {
  const cleaned = String(name || `Hoja${fallbackIdx}`)
    .replace(/[\\/?*[\]:]/g, ' ')
    .trim()
    .slice(0, 31);
  return cleaned || `Hoja${fallbackIdx}`;
}

function buildWorksheetXml(rows = []) {
  const maxCols = rows.reduce((m, r) => Math.max(m, (r?.cells || r || []).length), 1);
  const colWidths = new Array(maxCols).fill(14);

  const rowXmlList = rows.map((rowObj, rIdx) => {
    const isStyledObj = rowObj && !Array.isArray(rowObj) && Array.isArray(rowObj.cells);
    const cells = isStyledObj ? rowObj.cells : (Array.isArray(rowObj) ? rowObj : []);
    const rowStyle = isStyledObj ? (rowObj.style ?? 0) : 0;
    const rowNum = rIdx + 1;

    const cellsXml = cells
      .map((cell, cIdx) => {
        const ref = `${colLetter(cIdx)}${rowNum}`;
        const cellVal = cell && typeof cell === 'object' && 'v' in cell ? cell.v : cell;
        const styleIdx = cell && typeof cell === 'object' && 's' in cell ? cell.s : rowStyle;

        if (typeof cellVal === 'number' && Number.isFinite(cellVal)) {
          colWidths[cIdx] = Math.min(52, Math.max(colWidths[cIdx], String(cellVal).length + 4));
          return `<c r="${ref}" s="${styleIdx}" t="n"><v>${cellVal}</v></c>`;
        }

        const strVal = String(cellVal ?? '');
        colWidths[cIdx] = Math.min(52, Math.max(colWidths[cIdx], strVal.length + 4));
        return `<c r="${ref}" s="${styleIdx}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(strVal)}</t></is></c>`;
      })
      .join('');

    return `<row r="${rowNum}">${cellsXml}</row>`;
  });

  const colsXml = colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<cols>${colsXml}</cols>` +
    `<sheetData>${rowXmlList.join('')}</sheetData>` +
    '</worksheet>'
  );
}

const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="4">' +
  '<font><sz val="11"/><color rgb="FF1D1D1F"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="14"/><color rgb="FF1D1D1F"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><color rgb="FF8A6D3D"/><name val="Calibri"/></font>' +
  '</fonts>' +
  '<fills count="4">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF1D1D1F"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFF5F5F7"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="2">' +
  '<border><left/><right/><top/><bottom/><diagonal/></border>' +
  '<border>' +
  '<left style="thin"><color rgb="FFD1D1D6"/></left>' +
  '<right style="thin"><color rgb="FFD1D1D6"/></right>' +
  '<top style="thin"><color rgb="FFD1D1D6"/></top>' +
  '<bottom style="thin"><color rgb="FFD1D1D6"/></bottom>' +
  '</border>' +
  '</borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="4">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0"/>' +
  '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
  '<xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
  '</cellXfs>' +
  '</styleSheet>';

export function generateXlsxBlob(sheets = []) {
  const safeSheets = sheets.length > 0 ? sheets : [{ name: 'Reporte', rows: [['Sin datos']] }];

  const contentTypeOverrides = safeSheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('');

  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.workbook.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    contentTypeOverrides +
    '</Types>';

  const rootRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbookSheetsXml = safeSheets
    .map(
      (s, i) =>
        `<sheet name="${escapeXml(sanitizeSheetName(s.name, i + 1))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    )
    .join('');

  const workbookXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets>${workbookSheetsXml}</sheets>` +
    '</workbook>';

  const workbookRelsEntries = safeSheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join('');

  const workbookRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    workbookRelsEntries +
    `<Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    '</Relationships>';

  const zipEntries = [
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
    { name: 'xl/styles.xml', data: STYLES_XML },
    ...safeSheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: buildWorksheetXml(s.rows || []),
    })),
  ];

  const zipBytes = buildZipUint8Array(zipEntries);
  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ── Generador Microsoft Word (.doc HTML compatible) ──────────────────────────
export function generateWordHtmlBlob(htmlBody, title = 'Reporte Nova Work') {
  const fullHtml =
    '\uFEFF' +
    '<!DOCTYPE html>' +
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
    'xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head>' +
    '<meta charset="utf-8" />' +
    `<title>${escapeHtml(title)}</title>` +
    '<style>' +
    'body { font-family: Calibri, Arial, sans-serif; color: #1f2937; font-size: 11pt; margin: 24px; }' +
    'h1 { font-size: 16pt; color: #111827; margin-bottom: 4px; }' +
    'h2 { font-size: 12pt; color: #8a6d3d; margin-top: 16px; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; }' +
    'table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }' +
    'th { background-color: #1d1d1f; color: #ffffff; padding: 6px 8px; text-align: left; border: 1px solid #1d1d1f; }' +
    'td { padding: 6px 8px; border: 1px solid #d1d5db; vertical-align: top; }' +
    '.meta-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; margin: 12px 0; }' +
    '.sig-grid { width: 100%; margin-top: 36px; border: none; }' +
    '.sig-cell { width: 50%; border: none; text-align: center; padding-top: 28px; }' +
    '.sig-line { border-top: 1px solid #6b7280; width: 80%; margin: 0 auto 4px auto; }' +
    '</style>' +
    '</head>' +
    `<body>${htmlBody}</body>` +
    '</html>';

  return new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
}

export function triggerBlobDownload(blob, filename) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
  }, 500);
  return true;
}

function statusLabelForTask(t) {
  if (t.completed || t.status === 'completed') return 'Completada';
  if (t.status === 'unfulfilled') return 'No ejecutada';
  return 'Pendiente';
}

function safeFileSlug(str) {
  return String(str || 'reporte')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'reporte';
}

// ── Reporte Diario de Cumplimiento Operativo ─────────────────────────────────
export function buildDailyComplianceXlsxBlob(reportData = {}) {
  const userName = reportData.userName || 'Colaborador';
  const roleName = reportData.roleName || 'Cargo Operativo';
  const areaName = reportData.areaName || 'General';
  const dateStr = reportData.dateStr || '';
  const tasks = reportData.tasks || [];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed || t.status === 'completed').length;
  const unfulfilled = tasks.filter((t) => t.status === 'unfulfilled').length;
  const pending = Math.max(0, total - completed - unfulfilled);
  const kpiScore =
    reportData.kpiScore !== undefined
      ? Number(reportData.kpiScore)
      : total > 0
      ? Number(((completed / total) * 100).toFixed(1))
      : 100;

  const taskRows = [
    { cells: ['NOVA WORK · ACTA DE CUMPLIMIENTO DIARIO'], style: 1 },
    { cells: [`Colaborador: ${userName}`, `Cargo: ${roleName}`, `Área: ${areaName}`, `Jornada: ${dateStr}`], style: 3 },
    { cells: [] },
    {
      cells: ['#', 'Franja Horaria', 'Actividad / Gestión', 'Prioridad', 'Exigencia de Evidencia', 'Estado', 'Evidencia / Justificación', 'Hora Registro'],
      style: 2,
    },
    ...tasks.map((t, idx) => {
      const slot =
        t.start_time && t.end_time
          ? `${String(t.start_time).slice(0, 5)} - ${String(t.end_time).slice(0, 5)}`
          : 'Jornada';
      const pBadge = getPriorityBadge(t.priority);
      const eBadge = getEvidenceBadge(t.evidence_requirement);
      const photoCount = countEvidencePhotos(t.evidence_photo);
      const photoTag = photoCount === 1
        ? '1 soporte gráfico adjunto en plataforma'
        : photoCount > 1
        ? `${photoCount} soportes gráficos adjuntos en plataforma`
        : '';
      const support =
        t.status === 'unfulfilled'
          ? `Motivo: ${t.cancellation_reason || 'Sin justificación'}${photoTag ? ` (${photoTag})` : ''}`
          : t.evidence_text
          ? `${t.evidence_text}${photoTag ? ` [${photoCount} ${photoCount === 1 ? 'captura' : 'capturas'}]` : ''}`
          : photoTag || 'Ejecutado conforme';
      const timeStr = t.completed_at ? new Date(t.completed_at).toLocaleTimeString('es-CO') : '-';
      return {
        cells: [
          idx + 1,
          slot,
          t.title || 'Actividad',
          pBadge.label,
          eBadge.label,
          statusLabelForTask(t),
          support,
          timeStr,
        ],
        style: 0,
      };
    }),
  ];

  const summaryRows = [
    { cells: ['RESUMEN KPI DE JORNADA'], style: 1 },
    { cells: ['Indicador', 'Valor'], style: 2 },
    { cells: ['Colaborador', userName], style: 0 },
    { cells: ['Cargo', roleName], style: 0 },
    { cells: ['Fecha de Jornada', dateStr], style: 0 },
    { cells: ['Total Actividades', total], style: 0 },
    { cells: ['Completadas', completed], style: 0 },
    { cells: ['No Ejecutadas', unfulfilled], style: 0 },
    { cells: ['Pendientes', pending], style: 0 },
    { cells: ['Porcentaje Cumplimiento (%)', kpiScore], style: 3 },
  ];

  return generateXlsxBlob([
    { name: 'Gestion Diaria', rows: taskRows },
    { name: 'Resumen KPI', rows: summaryRows },
  ]);
}

export function exportDailyComplianceExcel(reportData = {}) {
  const blob = buildDailyComplianceXlsxBlob(reportData);
  const slug = safeFileSlug(reportData.userName);
  const filename = `NovaWork_Cumplimiento_${slug}_${reportData.dateStr || 'hoy'}.xlsx`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}

export function buildDailyComplianceWordBlob(reportData = {}) {
  const userName = reportData.userName || 'Colaborador';
  const roleName = reportData.roleName || 'Cargo Operativo';
  const areaName = reportData.areaName || 'General';
  const dateStr = reportData.dateStr || '';
  const tasks = reportData.tasks || [];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed || t.status === 'completed').length;
  const unfulfilled = tasks.filter((t) => t.status === 'unfulfilled').length;
  const kpiScore =
    reportData.kpiScore !== undefined
      ? Number(reportData.kpiScore)
      : total > 0
      ? Number(((completed / total) * 100).toFixed(1))
      : 100;

  const rowsHtml = tasks
    .map((t, idx) => {
      const slot =
        t.start_time && t.end_time
          ? `${String(t.start_time).slice(0, 5)} - ${String(t.end_time).slice(0, 5)}`
          : 'Jornada';
      const pBadge = getPriorityBadge(t.priority);
      const eBadge = getEvidenceBadge(t.evidence_requirement);
      const photoCount = countEvidencePhotos(t.evidence_photo);
      const photoTag = photoCount === 1
        ? '1 foto adjuntada en sistema'
        : photoCount > 1
        ? `${photoCount} fotos adjuntadas en sistema`
        : '';
      const support =
        t.status === 'unfulfilled'
          ? `Motivo: ${t.cancellation_reason || 'Sin justificación'}${photoTag ? ` (${photoTag})` : ''}`
          : t.evidence_text
          ? `${t.evidence_text}${photoTag ? ` [${photoCount} ${photoCount === 1 ? 'captura' : 'capturas'}]` : ''}`
          : photoTag || 'Ejecutado conforme';
      const timeStr = t.completed_at ? new Date(t.completed_at).toLocaleTimeString('es-CO') : '-';

      return `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(slot)}</td>
        <td><strong>${escapeHtml(t.title || 'Actividad')}</strong></td>
        <td>${escapeHtml(pBadge.label)}</td>
        <td>${escapeHtml(eBadge.label)}</td>
        <td>${escapeHtml(statusLabelForTask(t))}</td>
        <td>${escapeHtml(support)}</td>
        <td>${escapeHtml(timeStr)}</td>
      </tr>`;
    })
    .join('');

  const htmlBody = `
    <h1>NOVA WORK · ACTA OFICIAL DE CUMPLIMIENTO DIARIO</h1>
    <div class="meta-box">
      <p><strong>Colaborador:</strong> ${escapeHtml(userName)} &nbsp;|&nbsp; <strong>Cargo:</strong> ${escapeHtml(roleName)} (${escapeHtml(areaName)})</p>
      <p><strong>Fecha de Jornada:</strong> ${escapeHtml(dateStr)} &nbsp;|&nbsp; <strong>Cumplimiento KPI:</strong> ${escapeHtml(String(kpiScore))}% (${completed}/${total} completadas, ${unfulfilled} no ejecutadas)</p>
    </div>
    <h2>Detalle Cronológico de Actividades</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Horario</th>
          <th>Actividad</th>
          <th>Prioridad</th>
          <th>Evidencia</th>
          <th>Estado</th>
          <th>Soporte / Justificación</th>
          <th>Hora Reg.</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8">No hay actividades registradas en esta jornada.</td></tr>'}
      </tbody>
    </table>
    <table class="sig-grid">
      <tr>
        <td class="sig-cell">
          <div class="sig-line"></div>
          <strong>${escapeHtml(userName)}</strong><br/>Colaborador
        </td>
        <td class="sig-cell">
          <div class="sig-line"></div>
          <strong>Jefatura Inmediata / Auditoría</strong><br/>Revisión y Feedback
        </td>
      </tr>
    </table>
  `;

  return generateWordHtmlBlob(htmlBody, `Acta Cumplimiento - ${userName} - ${dateStr}`);
}

export function exportDailyComplianceWord(reportData = {}) {
  const blob = buildDailyComplianceWordBlob(reportData);
  const slug = safeFileSlug(reportData.userName);
  const filename = `NovaWork_Acta_${slug}_${reportData.dateStr || 'hoy'}.doc`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}

// ── Reporte Personal de KPIs / Feedback (Semanal, Quincenal, Mensual) ────────
export function buildKpiFeedbackXlsxBlob(kpiReportData = {}) {
  const userName = kpiReportData.userName || 'Colaborador';
  const roleName = kpiReportData.roleName || 'Cargo Operativo';
  const series = kpiReportData.series || {};
  const summary = series.summary || {};
  const points = series.points || [];

  const summaryRows = [
    { cells: ['NOVA WORK · INFORME DE KPIs Y RETROALIMENTACIÓN'], style: 1 },
    { cells: ['Campo', 'Valor'], style: 2 },
    { cells: ['Colaborador', userName], style: 0 },
    { cells: ['Cargo', roleName], style: 0 },
    { cells: ['Período Evaluado', series.rangeLabel || series.range || ''], style: 0 },
    { cells: ['Rango de Fechas', `${series.startDate || ''} a ${series.endDate || ''}`], style: 0 },
    { cells: ['Promedio de Cumplimiento (%)', summary.averageCompliance ?? 'N/A'], style: 3 },
    { cells: ['Meta Corporativa (%)', series.target ?? 85], style: 0 },
    { cells: ['Diagnóstico vs. Meta', summary.statusLabel || 'Sin registros'], style: 3 },
    { cells: ['Tendencia del Período (%)', summary.trendDelta ?? 'N/A'], style: 0 },
    { cells: ['Días Activos Evaluados', summary.activeDaysCount ?? 0], style: 0 },
    { cells: ['Días con Cierre Consolidado', summary.closedDaysCount ?? 0], style: 0 },
    { cells: ['Total Tareas Completadas', summary.totalCompleted ?? 0], style: 0 },
    { cells: ['Total Tareas Evaluadas', summary.totalTasks ?? 0], style: 0 },
  ];

  const historyRows = [
    { cells: ['HISTORIAL DIARIO DE CUMPLIMIENTO'], style: 1 },
    { cells: ['Fecha', 'Etiqueta', 'Cumplimiento (%)', 'Completadas', 'Total', 'No Ejecutadas', 'Cierre Formal'], style: 2 },
    ...points.map((p) => ({
      cells: [
        p.date,
        p.label,
        p.compliance !== null && p.compliance !== undefined ? p.compliance : 'Sin registro',
        p.completed ?? 0,
        p.total ?? 0,
        p.unfulfilled ?? 0,
        p.isClosed ? 'Cerrado' : p.source === 'activity' ? 'En curso' : 'Sin actividad',
      ],
      style: 0,
    })),
  ];

  return generateXlsxBlob([
    { name: 'Resumen Feedback KPI', rows: summaryRows },
    { name: 'Historial Diario', rows: historyRows },
  ]);
}

export function exportKpiFeedbackExcel(kpiReportData = {}) {
  const blob = buildKpiFeedbackXlsxBlob(kpiReportData);
  const slug = safeFileSlug(kpiReportData.userName);
  const range = kpiReportData.series?.range || 'kpi';
  const filename = `NovaWork_Feedback_KPI_${slug}_${range}.xlsx`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}

export function buildKpiFeedbackWordBlob(kpiReportData = {}) {
  const userName = kpiReportData.userName || 'Colaborador';
  const roleName = kpiReportData.roleName || 'Cargo Operativo';
  const series = kpiReportData.series || {};
  const summary = series.summary || {};
  const points = series.points || [];

  const avgText =
    summary.averageCompliance !== null && summary.averageCompliance !== undefined
      ? `${summary.averageCompliance}%`
      : 'Sin registros suficientes';
  const trendText =
    summary.trendDelta !== null && summary.trendDelta !== undefined
      ? `${summary.trendDelta >= 0 ? '+' : ''}${summary.trendDelta}%`
      : 'N/A';

  const activeRows = points
    .filter((p) => p.compliance !== null || p.total > 0 || p.isClosed)
    .map(
      (p) => `<tr>
        <td>${escapeHtml(p.date)}</td>
        <td><strong>${p.compliance !== null ? `${escapeHtml(String(p.compliance))}%` : 'N/A'}</strong></td>
        <td>${p.completed ?? 0} / ${p.total ?? 0}</td>
        <td>${p.unfulfilled ?? 0}</td>
        <td>${p.isClosed ? 'Cierre Consolidado' : 'Registro Parcial'}</td>
      </tr>`
    )
    .join('');

  const htmlBody = `
    <h1>NOVA WORK · INFORME DE DESEMPEÑO KPI Y RETROALIMENTACIÓN</h1>
    <div class="meta-box">
      <p><strong>Colaborador:</strong> ${escapeHtml(userName)} &nbsp;|&nbsp; <strong>Cargo:</strong> ${escapeHtml(roleName)}</p>
      <p><strong>Período Evaluado:</strong> ${escapeHtml(series.rangeLabel || '')} (${escapeHtml(series.startDate || '')} a ${escapeHtml(series.endDate || '')})</p>
      <p><strong>Promedio Cumplimiento:</strong> ${escapeHtml(avgText)} &nbsp;|&nbsp; <strong>Meta:</strong> &ge; ${series.target ?? 85}% &nbsp;|&nbsp; <strong>Estado:</strong> ${escapeHtml(summary.statusLabel || '')} &nbsp;|&nbsp; <strong>Tendencia:</strong> ${escapeHtml(trendText)}</p>
    </div>
    <h2>Desglose de Jornadas Evaluadas</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cumplimiento KPI</th>
          <th>Completadas / Total</th>
          <th>No Ejecutadas</th>
          <th>Estado de Cierre</th>
        </tr>
      </thead>
      <tbody>
        ${activeRows || '<tr><td colspan="5">No hay jornadas registradas en este rango.</td></tr>'}
      </tbody>
    </table>
    <h2>Espacio de Retroalimentación (Feedback Líder - Colaborador)</h2>
    <div class="meta-box">
      <p><strong>Fortalezas observadas:</strong> _______________________________________________________________</p>
      <p><strong>Oportunidades de mejora / Compromisos:</strong> __________________________________________________</p>
    </div>
  `;

  return generateWordHtmlBlob(htmlBody, `Feedback KPI - ${userName}`);
}

export function exportKpiFeedbackWord(kpiReportData = {}) {
  const blob = buildKpiFeedbackWordBlob(kpiReportData);
  const slug = safeFileSlug(kpiReportData.userName);
  const range = kpiReportData.series?.range || 'kpi';
  const filename = `NovaWork_Feedback_KPI_${slug}_${range}.doc`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}

// ── Exportación para Informes de Equipo (PerformanceReportsView.vue) ─────────
export function buildTeamPerformanceXlsxBlob(teamReport = {}) {
  const periodLabel = teamReport?.period?.label || 'Período';
  const kpis = teamReport?.kpis || [];
  const byUser = teamReport?.by_user || [];
  const summary = teamReport?.summary || {};

  const teamSheetRows = [
    { cells: ['NOVA WORK · INFORME DE RENDIMIENTO KPI POR EQUIPO'], style: 1 },
    { cells: [`Período: ${periodLabel}`, `Programadas: ${summary.total_scheduled ?? 0}`, `Completadas: ${summary.completed ?? 0}`, `Vencidas: ${summary.overdue ?? 0}`], style: 3 },
    { cells: [] },
    { cells: ['Indicador KPI', 'Valor (%)', 'Meta', 'Estado'], style: 2 },
    ...kpis.map((k) => ({
      cells: [k.name, k.value === null ? 'N/A' : k.value, `${k.operator} ${k.target}${k.unit}`, k.status],
      style: 0,
    })),
    { cells: [] },
    { cells: ['Colaborador', 'Área', 'Programadas', 'Cumplimiento (%)', 'Puntualidad (%)', 'Tasa Vencidas (%)'], style: 2 },
    ...byUser.map((u) => ({
      cells: [
        u.full_name,
        u.area_name,
        u.summary?.total_scheduled ?? 0,
        u.compliance_rate ?? 'N/A',
        u.on_time_rate ?? 'N/A',
        u.overdue_rate ?? 'N/A',
      ],
      style: 0,
    })),
  ];

  return generateXlsxBlob([{ name: 'Rendimiento Equipo', rows: teamSheetRows }]);
}

export function exportTeamPerformanceExcel(teamReport = {}) {
  const blob = buildTeamPerformanceXlsxBlob(teamReport);
  const slug = safeFileSlug(teamReport?.period?.label || 'periodo');
  const filename = `NovaWork_Rendimiento_${slug}.xlsx`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}

export function buildTeamPerformanceWordBlob(teamReport = {}) {
  const periodLabel = teamReport?.period?.label || 'Período';
  const kpis = teamReport?.kpis || [];
  const byUser = teamReport?.by_user || [];
  const summary = teamReport?.summary || {};

  const kpiRows = kpis
    .map(
      (k) => `<tr>
        <td>${escapeHtml(k.name)}</td>
        <td><strong>${k.value === null ? 'N/A' : `${escapeHtml(String(k.value))}%`}</strong></td>
        <td>${escapeHtml(`${k.operator} ${k.target}${k.unit}`)}</td>
        <td>${escapeHtml(k.status)}</td>
      </tr>`
    )
    .join('');

  const userRows = byUser
    .map(
      (u) => `<tr>
        <td>${escapeHtml(u.full_name)}</td>
        <td>${escapeHtml(u.area_name)}</td>
        <td>${u.summary?.total_scheduled ?? 0}</td>
        <td>${u.compliance_rate === null ? 'N/A' : `${u.compliance_rate}%`}</td>
        <td>${u.on_time_rate === null ? 'N/A' : `${u.on_time_rate}%`}</td>
        <td>${u.overdue_rate === null ? 'N/A' : `${u.overdue_rate}%`}</td>
      </tr>`
    )
    .join('');

  const htmlBody = `
    <h1>NOVA WORK · INFORME DE RENDIMIENTO KPI</h1>
    <div class="meta-box">
      <p><strong>Período:</strong> ${escapeHtml(periodLabel)} &nbsp;|&nbsp; <strong>Programadas:</strong> ${summary.total_scheduled ?? 0} &nbsp;|&nbsp; <strong>Completadas:</strong> ${summary.completed ?? 0} &nbsp;|&nbsp; <strong>Vencidas:</strong> ${summary.overdue ?? 0}</p>
    </div>
    <h2>Indicadores Globales</h2>
    <table>
      <thead><tr><th>Indicador</th><th>Resultado</th><th>Meta</th><th>Estado</th></tr></thead>
      <tbody>${kpiRows}</tbody>
    </table>
    <h2>Desglose por Colaborador (Insumo de Feedback)</h2>
    <table>
      <thead><tr><th>Colaborador</th><th>Área</th><th>Programadas</th><th>Cumplimiento</th><th>Puntualidad</th><th>Vencidas</th></tr></thead>
      <tbody>${userRows || '<tr><td colspan="6">Sin registros en este período.</td></tr>'}</tbody>
    </table>
  `;

  return generateWordHtmlBlob(htmlBody, `Rendimiento KPI - ${periodLabel}`);
}

export function exportTeamPerformanceWord(teamReport = {}) {
  const blob = buildTeamPerformanceWordBlob(teamReport);
  const slug = safeFileSlug(teamReport?.period?.label || 'periodo');
  const filename = `NovaWork_Rendimiento_${slug}.doc`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}
