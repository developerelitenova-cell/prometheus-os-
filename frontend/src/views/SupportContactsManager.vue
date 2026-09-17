<template>
  <div class="contacts-manager">
    <header class="page-header">
      <div class="header-content">
        <button @click="$router.back()" class="back-link cursor-pointer">← Volver</button>
        <h1>Directorio de Soporte (WhatsApp)</h1>
        <p class="subtitle">Contactos que el Asistente IA recomienda cuando un empleado necesita ayuda humana. Mantené esto al día cuando alguien cambie de cargo o de línea.</p>
      </div>
      <button class="btn-primary" @click="openNewForm">+ Agregar Contacto</button>
    </header>

    <div class="filter-row">
      <input v-model="search" type="text" placeholder="Buscar por nombre, cargo o área..." class="search-input" />
    </div>

    <div v-if="loading" class="empty-state">Cargando directorio...</div>
    <div v-else-if="filteredContacts.length === 0" class="empty-state">
      {{ search ? 'No hay contactos que coincidan con la búsqueda.' : 'Todavía no hay contactos cargados.' }}
    </div>

    <div v-else class="contacts-table-wrapper glass-panel">
      <table class="contacts-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Área</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in filteredContacts" :key="contact.id">
            <td>{{ contact.name }}</td>
            <td>{{ contact.role || '—' }}</td>
            <td>{{ contact.area || '—' }}</td>
            <td>{{ contact.phone || '—' }}</td>
            <td>{{ contact.email || '—' }}</td>
            <td class="row-actions">
              <button class="icon-btn" title="Editar" @click="openEditForm(contact)">✎</button>
              <button class="icon-btn danger" title="Quitar" @click="confirmDelete(contact)">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Agregar / Editar contacto -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content glass-panel">
        <h2>{{ editingId ? 'Editar Contacto' : 'Nuevo Contacto' }}</h2>
        <form @submit.prevent="saveContact" class="contact-form">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" v-model="form.name" required placeholder="Nombre completo" />
          </div>
          <div class="form-group">
            <label>Cargo</label>
            <input type="text" v-model="form.role" placeholder="Ej: Líder de Seguridad" />
          </div>
          <div class="form-group">
            <label>Área</label>
            <input type="text" v-model="form.area" placeholder="Ej: Tecnología" />
          </div>
          <div class="form-group">
            <label>Teléfono (WhatsApp)</label>
            <input type="text" v-model="form.phone" placeholder="Ej: 3157316643" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" v-model="form.email" placeholder="correo@elitenutrition.com.co" />
          </div>

          <p v-if="formError" class="error-text">{{ formError }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-text" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Agregar Contacto') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Confirmar borrado -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal-content glass-panel small">
        <h2>¿Quitar a {{ deleteTarget.name }}?</h2>
        <p class="subtitle">Ya no va a aparecer como opción de contacto en el Asistente IA.</p>
        <div class="modal-actions">
          <button class="btn-text" @click="deleteTarget = null">Cancelar</button>
          <button class="btn-danger" @click="deleteContact" :disabled="deleting">
            {{ deleting ? 'Quitando...' : 'Sí, quitar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../api/supabase';

const contacts = ref([]);
const loading = ref(true);
const search = ref('');

const showForm = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');
const form = ref({ name: '', role: '', area: '', phone: '', email: '' });

const deleteTarget = ref(null);
const deleting = ref(false);

const filteredContacts = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return contacts.value;
  return contacts.value.filter(c =>
    [c.name, c.role, c.area].some(field => (field || '').toLowerCase().includes(q))
  );
});

const fetchContacts = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('support_contacts')
      .select('*')
      .order('name');
    if (error) throw error;
    contacts.value = data || [];
  } catch (e) {
    console.error('Error cargando el directorio de soporte:', e);
    contacts.value = [];
  } finally {
    loading.value = false;
  }
};

const openNewForm = () => {
  editingId.value = null;
  form.value = { name: '', role: '', area: '', phone: '', email: '' };
  formError.value = '';
  showForm.value = true;
};

const openEditForm = (contact) => {
  editingId.value = contact.id;
  form.value = {
    name: contact.name || '',
    role: contact.role || '',
    area: contact.area || '',
    phone: contact.phone || '',
    email: contact.email || ''
  };
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
};

const saveContact = async () => {
  formError.value = '';
  if (!form.value.name.trim()) {
    formError.value = 'El nombre es obligatorio.';
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      role: form.value.role.trim() || null,
      area: form.value.area.trim() || null,
      phone: form.value.phone.trim() || null,
      email: form.value.email.trim() || null
    };

    if (editingId.value) {
      const { error } = await supabase.from('support_contacts').update(payload).eq('id', editingId.value);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('support_contacts').insert([payload]);
      if (error) throw error;
    }

    showForm.value = false;
    await fetchContacts();
  } catch (e) {
    formError.value = e.message || 'No se pudo guardar el contacto.';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (contact) => {
  deleteTarget.value = contact;
};

const deleteContact = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    const { error } = await supabase.from('support_contacts').delete().eq('id', deleteTarget.value.id);
    if (error) throw error;
    contacts.value = contacts.value.filter(c => c.id !== deleteTarget.value.id);
    deleteTarget.value = null;
  } catch (e) {
    console.error('Error quitando contacto:', e);
    alert('No se pudo quitar el contacto: ' + (e.message || ''));
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchContacts();
});
</script>

<style scoped>
.contacts-manager {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;
}

.back-link {
  color: var(--gold-deep);
  text-decoration: none;
  font-size: 0.85rem;
  margin-bottom: 8px;
  display: inline-block;
}

.header-content h1 {
  font-size: 28px;
  color: var(--text-primary);
  margin: 4px 0 8px 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  max-width: 560px;
}

.btn-primary {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #000;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filter-row {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 360px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: inherit;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.contacts-table-wrapper {
  overflow-x: auto;
  padding: 0;
}

.contacts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.contacts-table th {
  text-align: left;
  padding: 14px 20px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
}

.contacts-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink-secondary);
}

.contacts-table tr:last-child td {
  border-bottom: none;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.icon-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--ink);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--surface);
  border-color: var(--gold);
}

.icon-btn.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  padding: 32px;
}

.modal-content.small {
  max-width: 400px;
}

.modal-content h2 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  color: var(--ink);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: inherit;
  font-size: 0.9rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.error-text {
  margin: 0 0 12px 0;
  color: var(--danger);
  font-size: 0.85rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-text {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-danger {
  background: var(--danger);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
