import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TaskEvidenceModal from '../../src/components/TaskEvidenceModal.vue';
import { parseEvidencePhotos } from '../../src/utils/evidencePhotos';

let uploadCounter = 0;

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async (filePath) => {
          uploadCounter += 1;
          return { data: { path: filePath }, error: null };
        }),
        getPublicUrl: vi.fn((filePath) => ({
          data: { publicUrl: `https://cdn.novawork.local/task_evidence/${filePath}` },
        })),
      })),
    },
  },
}));

function makeImageFile(name = 'shot.png') {
  return new File(['fake-image-bytes'], name, { type: 'image/png' });
}

function attachFilesToInput(wrapper, files) {
  const input = wrapper.find('[data-testid="evidence-file-input"]');
  Object.defineProperty(input.element, 'files', {
    value: files,
    configurable: true,
  });
  return input.trigger('change');
}

function dispatchPasteWithImages(files) {
  const evt = new Event('paste', { bubbles: true });
  evt.clipboardData = {
    items: files.map((file) => ({
      type: file.type,
      getAsFile: () => file,
    })),
  };
  window.dispatchEvent(evt);
}

describe('TaskEvidenceModal.vue Multi-Image, Lightbox & Overdue Delay Justification', () => {
  let alertSpy;
  const mountedWrappers = [];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    uploadCounter = 0;
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop().unmount();
    }
    alertSpy.mockRestore();
  });

  const mountModal = (props) => {
    const wrapper = mount(TaskEvidenceModal, {
      props: {
        modelValue: true,
        taskType: 'task',
        ...props,
      },
    });
    mountedWrappers.push(wrapper);
    return wrapper;
  };

  it('supports uploading multiple screenshots, pasting extra captures via Ctrl+V, enforcing max-5 cap, removing one, and emitting JSON array', async () => {
    const wrapper = mountModal({
      task: {
        id: 't_multi_1',
        title: 'Consolidar pagos',
        priority: 'high',
        evidence_requirement: 'photo_required',
        status: 'pending',
        due_date: '2099-12-31',
      },
    });
    await flushPromises();

    // 1. Subir 2 imágenes desde selector múltiple
    await attachFilesToInput(wrapper, [makeImageFile('uno.png'), makeImageFile('dos.png')]);
    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-testid="evidence-photo-thumb"]')).toHaveLength(2);
    });

    // 2. Pegar 3ra captura vía Ctrl+V
    dispatchPasteWithImages([makeImageFile('tres_ctrlv.png')]);
    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-testid="evidence-photo-thumb"]')).toHaveLength(3);
    });

    // 3. Intentar subir 3 más -> debe topar en 5 y mostrar aviso
    await attachFilesToInput(wrapper, [
      makeImageFile('cuatro.png'),
      makeImageFile('cinco.png'),
      makeImageFile('seis_exceso.png'),
    ]);
    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-testid="evidence-photo-thumb"]')).toHaveLength(5);
    });
    expect(wrapper.find('[data-testid="max-photos-notice"]').exists()).toBe(true);

    // 4. Eliminar 2da captura -> quedan 4
    const removeButtons = wrapper.findAll('[data-testid="remove-evidence-photo"]');
    await removeButtons[1].trigger('click');
    expect(wrapper.findAll('[data-testid="evidence-photo-thumb"]')).toHaveLength(4);

    // 5. Escribir texto y confirmar
    await wrapper.find('[data-testid="evidence-text-input"]').setValue('Adjunto soportes completos');
    await wrapper.find('[data-testid="submit-evidence-btn"]').trigger('click');
    await flushPromises();

    const emittedSave = wrapper.emitted('save');
    expect(emittedSave).toBeTruthy();
    const payload = emittedSave[0][0];
    expect(payload.status).toBe('completed');
    expect(payload.evidence_photos).toHaveLength(4);
    expect(parseEvidencePhotos(payload.evidence_photo)).toHaveLength(4);
    expect(uploadCounter).toBe(4);
  });

  it('renders existing multi-photo gallery and navigates images in Lightbox', async () => {
    const photos = [
      'https://cdn.novawork.local/1.jpg',
      'https://cdn.novawork.local/2.jpg',
      'https://cdn.novawork.local/3.jpg',
    ];

    const wrapper = mountModal({
      task: {
        id: 't_view_1',
        title: 'Auditoría con 3 capturas',
        priority: 'medium',
        evidence_requirement: 'photo_required',
        status: 'completed',
        completed: true,
        evidence_text: 'Evidencia completa',
        evidence_photo: JSON.stringify(photos),
      },
    });
    await flushPromises();

    const cards = wrapper.findAll('[data-testid="existing-evidence-photo"]');
    expect(cards).toHaveLength(3);

    // Abrir lightbox en imagen #1
    await cards[0].trigger('click');
    const lightbox = wrapper.find('[data-testid="evidence-lightbox"]');
    expect(lightbox.exists()).toBe(true);
    expect(lightbox.text()).toContain('1 / 3');
    expect(lightbox.find('img').attributes('src')).toBe(photos[0]);

    // Avanzar con siguiente y retroceder
    await wrapper.find('[data-testid="lightbox-next"]').trigger('click');
    expect(wrapper.find('[data-testid="evidence-lightbox"]').text()).toContain('2 / 3');
    expect(wrapper.find('[data-testid="evidence-lightbox"] img').attributes('src')).toBe(photos[1]);

    await wrapper.find('[data-testid="lightbox-prev"]').trigger('click');
    expect(wrapper.find('[data-testid="evidence-lightbox"]').text()).toContain('1 / 3');
  });

  it('requires delay justification comment when completing an overdue task', async () => {
    const wrapper = mountModal({
      task: {
        id: 't_overdue_delay',
        title: 'Enviar informe vencido',
        priority: 'urgent',
        evidence_requirement: 'none',
        status: 'pending',
        due_date: '2020-01-10',
      },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="overdue-delay-notice"]').exists()).toBe(true);

    // Intentar confirmar sin comentario -> bloqueado
    await wrapper.find('[data-testid="submit-evidence-btn"]').trigger('click');
    expect(alertSpy).toHaveBeenCalled();
    expect(wrapper.emitted('save')).toBeFalsy();

    // Ingresar explicación de retraso -> permite confirmar
    await wrapper
      .find('[data-testid="evidence-text-input"]')
      .setValue('Se retrasó por caída de ERP y ya quedó enviado.');
    await wrapper.find('[data-testid="submit-evidence-btn"]').trigger('click');
    await flushPromises();

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.status).toBe('completed');
    expect(saved.evidence_text).toContain('caída de ERP');
  });

  it('requires unfulfilled reason and supports multiple blocker screenshots in No se pudo ejecutar mode', async () => {
    const wrapper = mountModal({
      task: {
        id: 't_unfulfilled_1',
        title: 'Cargue bancario',
        priority: 'high',
        evidence_requirement: 'photo_required',
        status: 'pending',
        due_date: '2099-12-31',
      },
    });
    await flushPromises();

    const unfulfilledBtn = wrapper.findAll('button').find((b) => b.text().includes('No se pudo ejecutar'));
    await unfulfilledBtn.trigger('click');

    // Sin motivo debe alertar y bloquear
    await wrapper.find('[data-testid="submit-evidence-btn"]').trigger('click');
    expect(alertSpy).toHaveBeenCalled();
    expect(wrapper.emitted('save')).toBeFalsy();

    // Llenar motivo + subir 2 pantallazos del error
    await wrapper
      .find('[data-testid="cancellation-reason-input"]')
      .setValue('El portal bancario estuvo en mantenimiento toda la tarde.');
    await attachFilesToInput(wrapper, [makeImageFile('err1.png'), makeImageFile('err2.png')]);
    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-testid="evidence-photo-thumb"]')).toHaveLength(2);
    });

    await wrapper.find('[data-testid="submit-evidence-btn"]').trigger('click');
    await flushPromises();

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.status).toBe('unfulfilled');
    expect(saved.cancellation_reason).toContain('portal bancario');
    expect(parseEvidencePhotos(saved.evidence_photo)).toHaveLength(2);
  });
});
