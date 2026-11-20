import { describe, it, expect } from 'vitest';
import { getPriorityBadge, getEvidenceBadge } from '../../src/utils/taskBadges';
import { buildPersonalKpiSeries } from '../../src/utils/personalKpiSeries';
import {
  buildDailyComplianceXlsxBlob,
  buildDailyComplianceWordBlob,
  buildKpiFeedbackXlsxBlob,
  buildKpiFeedbackWordBlob,
  escapeHtml,
} from '../../src/utils/reportExporter';
import { getPeriodBoundsBogota } from '../../src/utils/kpiCalculator';

describe('taskBadges utilities', () => {
  it('maps priority levels uniformly with fallback to medium', () => {
    expect(getPriorityBadge('urgent').label).toBe('Urgente');
    expect(getPriorityBadge('high').label).toBe('Alta');
    expect(getPriorityBadge('medium').label).toBe('Media');
    expect(getPriorityBadge('low').label).toBe('Baja');
    expect(getPriorityBadge(null).key).toBe('medium');
    expect(getPriorityBadge('unknown').key).toBe('medium');
  });

  it('distinguishes mandatory vs optional evidence explicitly', () => {
    const photo = getEvidenceBadge('photo_required');
    expect(photo.mandatory).toBe(true);
    expect(photo.label).toBe('Evidencia Obligatoria · Foto');
    expect(photo.testId).toBe('evidence-badge-mandatory');

    const text = getEvidenceBadge('text_only');
    expect(text.mandatory).toBe(true);
    expect(text.label).toBe('Evidencia Obligatoria · Nota');
    expect(text.testId).toBe('evidence-badge-mandatory');

    const opt = getEvidenceBadge('none');
    expect(opt.mandatory).toBe(false);
    expect(opt.label).toBe('Evidencia Opcional');
    expect(opt.testId).toBe('evidence-badge-optional');

    expect(getEvidenceBadge(undefined).label).toBe('Evidencia Opcional');
  });
});

describe('kpiCalculator biweekly bounds', () => {
  it('computes first and second quincena bounds accurately', () => {
    const q1 = getPeriodBoundsBogota('biweekly', '2026-11-10');
    expect(q1.startDate).toBe('2026-11-01');
    expect(q1.endDate).toBe('2026-11-15');
    expect(q1.label).toBe('Quincena 1 (2026-11)');

    const q2 = getPeriodBoundsBogota('biweekly', '2026-11-20');
    expect(q2.startDate).toBe('2026-11-16');
    expect(q2.endDate).toBe('2026-11-30');
    expect(q2.label).toBe('Quincena 2 (2026-11)');
  });
});

describe('personalKpiSeries builder', () => {
  it('builds exact day counts for weekly, biweekly, and monthly ranges', () => {
    const w = buildPersonalKpiSeries({ range: 'weekly', referenceDateStr: '2026-11-20' });
    const b = buildPersonalKpiSeries({ range: 'biweekly', referenceDateStr: '2026-11-20' });
    const m = buildPersonalKpiSeries({ range: 'monthly', referenceDateStr: '2026-11-20' });

    expect(w.points).toHaveLength(7);
    expect(w.points[0].date).toBe('2026-11-14');
    expect(w.points[6].date).toBe('2026-11-20');

    expect(b.points).toHaveLength(15);
    expect(m.points).toHaveLength(30);
  });

  it('prioritizes daily_closings, excludes empty days, and computes positive trendDelta', () => {
    const series = buildPersonalKpiSeries({
      range: 'weekly',
      referenceDateStr: '2026-11-20',
      dailyClosings: [
        { period_key: '2026-11-15', compliance_percentage: 70, completed_tasks: 7, total_tasks: 10, unfulfilled_tasks: 0 },
        { period_key: '2026-11-19', compliance_percentage: 90, completed_tasks: 9, total_tasks: 10, unfulfilled_tasks: 0 },
      ],
      taskCompletions: [
        // 2026-11-15 también tiene completion, pero daily_closings debe prevalecer
        { task_template_id: 'tpl_1', period_key: '2026-11-15', status: 'completed' },
        // 2026-11-20 abierto con 4/4 completadas (100%)
        { task_template_id: 'tpl_1', period_key: '2026-11-20', status: 'completed' },
        { task_template_id: 'tpl_2', period_key: '2026-11-20', status: 'completed' },
        { task_template_id: 'tpl_3', period_key: '2026-11-20', status: 'completed' },
        { task_template_id: 'tpl_4', period_key: '2026-11-20', status: 'completed' },
      ],
      dailyTemplatesCount: 4,
    });

    const p15 = series.points.find((p) => p.date === '2026-11-15');
    expect(p15.compliance).toBe(70);
    expect(p15.isClosed).toBe(true);

    const p20 = series.points.find((p) => p.date === '2026-11-20');
    expect(p20.compliance).toBe(100);
    expect(p20.isClosed).toBe(false);

    // Días activos: 15 (70%), 19 (90%), 20 (100%) -> avg = 86.7 >= 85
    expect(series.summary.activeDaysCount).toBe(3);
    expect(series.summary.closedDaysCount).toBe(2);
    expect(series.summary.averageCompliance).toBe(86.7);
    expect(series.summary.meetsTarget).toBe(true);
    expect(series.summary.trendDelta).toBeGreaterThan(0);
  });
});

describe('reportExporter OOXML (.xlsx) and Word (.doc)', () => {
  it('generates valid ZIP OOXML .xlsx blobs with workbook, styles, and worksheets', async () => {
    const xlsxBlob = buildDailyComplianceXlsxBlob({
      userName: 'Ana María',
      roleName: 'Asistente Presidencia',
      areaName: 'Presidencia',
      dateStr: '2026-11-20',
      kpiScore: 90,
      tasks: [
        {
          id: 't1',
          title: 'Revisar agenda presidencia',
          start_time: '08:00:00',
          end_time: '08:30:00',
          priority: 'urgent',
          evidence_requirement: 'photo_required',
          completed: true,
          status: 'completed',
          evidence_text: 'Agenda confirmada & aprobada',
        },
      ],
    });

    const buf = new Uint8Array(await xlsxBlob.arrayBuffer());
    // PKZIP Local File Header magic signature: 0x50 0x4B 0x03 0x04
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    expect(buf[2]).toBe(0x03);
    expect(buf[3]).toBe(0x04);

    const rawText = new TextDecoder().decode(buf);
    expect(rawText).toContain('[Content_Types].xml');
    expect(rawText).toContain('xl/workbook.xml');
    expect(rawText).toContain('xl/styles.xml');
    expect(rawText).toContain('xl/worksheets/sheet1.xml');
    expect(rawText).toContain('xl/worksheets/sheet2.xml');
    expect(rawText).toContain('Revisar agenda presidencia');
    expect(rawText).toContain('Evidencia Obligatoria');
  });

  it('escapes HTML/XSS safely inside Word .doc compliance and KPI feedback reports', async () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );

    const wordBlob = buildDailyComplianceWordBlob({
      userName: '<img src=x onerror=alert(1)>',
      roleName: 'Presidencia',
      dateStr: '2026-11-20',
      kpiScore: 100,
      tasks: [
        {
          title: 'Revisar acta <script>evil()</script>',
          priority: 'high',
          evidence_requirement: 'none',
          status: 'completed',
          completed: true,
        },
      ],
    });

    const docHtml = await wordBlob.text();
    expect(docHtml).toContain('urn:schemas-microsoft-com:office:word');
    expect(docHtml).not.toContain('<script>evil()</script>');
    expect(docHtml).not.toContain('<img src=x onerror=alert(1)>');
    expect(docHtml).toContain('&lt;script&gt;evil()&lt;/script&gt;');

    const series = buildPersonalKpiSeries({
      range: 'weekly',
      referenceDateStr: '2026-11-20',
      dailyClosings: [{ period_key: '2026-11-20', compliance_percentage: 95, completed_tasks: 9, total_tasks: 10 }],
    });
    const kpiXlsx = buildKpiFeedbackXlsxBlob({ userName: 'Ana', roleName: 'Asist', series });
    const kpiBuf = new Uint8Array(await kpiXlsx.arrayBuffer());
    expect(kpiBuf[0]).toBe(0x50);
    expect(kpiBuf[1]).toBe(0x4b);

    const kpiDoc = await buildKpiFeedbackWordBlob({ userName: 'Ana', roleName: 'Asist', series }).text();
    expect(kpiDoc).toContain('INFORME DE DESEMPEÑO KPI Y RETROALIMENTACIÓN');
    expect(kpiDoc).toContain('95%');
  });
});
