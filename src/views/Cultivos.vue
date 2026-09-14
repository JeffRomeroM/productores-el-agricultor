<template>
  <div class="cultivos-container">
    <!-- Toast de Notificaciones -->
    <Transition name="toast">
      <div v-if="notificacion.visible" :class="['toast-notification', notificacion.tipo]">
        <Icon :icon="notificacion.tipo === 'error' ? 'ph:warning-circle-bold' : 'ph:check-circle-bold'" class="toast-icon" />
        <span class="toast-message">{{ notificacion.mensaje }}</span>
        <button class="toast-close" @click="notificacion.visible = false">
          <Icon icon="ph:x-bold" />
        </button>
      </div>
    </Transition>

    <header class="header">
      <div class="title-group">
        <h2>Cultivos</h2>
        <span class="count-badge">{{ cultivosFiltrados.length }}</span>
      </div>
      <button class="btn-primary" @click="abrirModal()">
        <Icon icon="ph:plus-bold" />
        Nuevo
      </button>
    </header>

    <!-- Banner de Error Global si falla la carga inicial -->
    <div v-if="errorCarga" class="error-banner">
      <Icon icon="ph:warning-bold" class="banner-icon" />
      <div class="banner-content">
        <p>No se pudieron actualizar los datos del catálogo.</p>
        <button class="btn-retry" @click="cargarCultivos">Reintentar</button>
      </div>
    </div>

    <!-- Buscador -->
    <div class="search-bar">
      <Icon icon="ph:magnifying-glass-bold" class="search-icon" />
      <input 
        v-model="busqueda" 
        type="text" 
        placeholder="Buscar cultivo..." 
      />
      <button 
        v-if="busqueda" 
        class="btn-clear" 
        @click="busqueda = ''"
        title="Limpiar búsqueda"
      >
        <Icon icon="ph:x-bold" />
      </button>
    </div>

    <!-- Loader -->
    <div v-if="cargando && cultivos.length === 0" class="loading-state">
      Cargando cultivos...
    </div>

    <!-- Lista de Cultivos -->
    <div v-else-if="cultivosFiltrados.length > 0" class="cultivos-grid">
      <div v-for="item in cultivosFiltrados" :key="item.id" class="cultivo-card">
        <div class="card-info">
          <Icon icon="ph:plant-duotone" class="cultivo-icon" />
          <span class="cultivo-nombre">{{ item.nombre }}</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-edit" @click="abrirModal(item)" title="Editar">
            <Icon icon="ph:pencil-simple-bold" />
          </button>
          <button class="btn-icon btn-delete" @click="abrirModalEliminar(item)" title="Eliminar">
            <Icon icon="ph:trash-bold" />
          </button>
        </div>
      </div>
    </div>

    <!-- Estado Vacío -->
    <div v-else class="empty-state">
      <Icon icon="ph:plant-light" class="empty-icon" />
      <p v-if="busqueda">No se encontraron cultivos que coincidan con "{{ busqueda }}".</p>
      <p v-else>No hay cultivos registrados en el catálogo.</p>
    </div>

    <!-- Modal Formulario (Crear / Editar) -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-box">
        <h3>{{ modoEdicion ? 'Editar Cultivo' : 'Nuevo Cultivo' }}</h3>
        <form @submit.prevent="guardarCultivo">
          <div class="input-group">
            <label>Nombre del Cultivo</label>
            <input 
              v-model="nombre" 
              type="text" 
              placeholder="Ej. Aguacate, Pitahaya..." 
              required 
              ref="inputNombre"
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Confirmación de Eliminación Definitiva -->
    <div v-if="modalEliminarAbierto" class="modal-overlay" @click.self="cerrarModalEliminar">
      <div class="modal-box modal-delete">
        <div class="delete-icon-wrapper">
          <Icon icon="ph:trash-bold" class="delete-warning-icon" />
        </div>
        <h3>¿Eliminar cultivo definitivamente?</h3>
        <p class="delete-description">
          ¿Estás seguro de que deseas borrar <strong>"{{ cultivoAEliminar?.nombre }}"</strong> de la base de datos? Esta acción es irreversible.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="cerrarModalEliminar" :disabled="eliminando">
            Cancelar
          </button>
          <button type="button" class="btn-confirm-delete" @click="confirmarEliminar" :disabled="eliminando">
            {{ eliminando ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const verificarAccesoAdmin = () => {
  const rol = localStorage.getItem('vagrop_rol')
  if (rol !== 'admin') {
    alert('Acceso denegado: Se requieren permisos de administrador.')
    router.push('/productores')
  }
}


const CACHE_KEY = 'vagrop_cultivos_catalogo_cache'

const cultivos = ref([])
const busqueda = ref('')
const cargando = ref(true)
const guardando = ref(false)
const eliminando = ref(false)
const modalAbierto = ref(false)
const modoEdicion = ref(false)
const errorCarga = ref(false)

const modalEliminarAbierto = ref(false)
const cultivoAEliminar = ref(null)

const idSeleccionado = ref(null)
const nombre = ref('')
const inputNombre = ref(null)

const notificacion = ref({
  visible: false,
  mensaje: '',
  tipo: 'error'
})

let toastTimeout = null
const mostrarNotificacion = (mensaje, tipo = 'error') => {
  if (toastTimeout) clearTimeout(toastTimeout)
  notificacion.value = { visible: true, mensaje, tipo }
  toastTimeout = setTimeout(() => {
    notificacion.value.visible = false
  }, 4000)
}

const parsearErrorSupabase = (error) => {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '23505') return 'Ya existe un cultivo con este nombre.'
  if (error.code === '23503') return 'No se puede eliminar: este cultivo está vinculado a registros activos.'
  if (error.code === 'PGRST301' || error.message?.includes('FetchError') || !navigator.onLine) {
    return 'Sin conexión. Verifica tu acceso a internet.'
  }
  return error.message || 'No se pudo completar la operación.'
}

const cultivosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return cultivos.value
  const q = busqueda.value.toLowerCase().trim()
  return cultivos.value.filter(item => item.nombre.toLowerCase().includes(q))
})

const cargarCacheLocal = () => {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    cultivos.value = JSON.parse(cached)
    cargando.value = false
  }
}

const cargarCultivos = async () => {
  cargarCacheLocal()
  errorCarga.value = false
  try {
    const { data, error } = await supabase
      .from('cultivos')
      .select('id, nombre')
      .order('nombre', { ascending: true })

    if (error) throw error

    if (data) {
      cultivos.value = data
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    }
  } catch (err) {
    console.error('Error al cargar cultivos:', err)
    errorCarga.value = true
    mostrarNotificacion(parsearErrorSupabase(err), 'error')
  } finally {
    cargando.value = false
  }
}

const abrirModal = (item = null) => {
  if (item) {
    modoEdicion.value = true
    idSeleccionado.value = item.id
    nombre.value = item.nombre
  } else {
    modoEdicion.value = false
    idSeleccionado.value = null
    nombre.value = ''
  }
  modalAbierto.value = true
  nextTick(() => {
    if (inputNombre.value) inputNombre.value.focus()
  })
}

const cerrarModal = () => {
  modalAbierto.value = false
  nombre.value = ''
  idSeleccionado.value = null
}

const abrirModalEliminar = (item) => {
  cultivoAEliminar.value = item
  modalEliminarAbierto.value = true
}

const cerrarModalEliminar = () => {
  modalEliminarAbierto.value = false
  cultivoAEliminar.value = null
}

const guardarCultivo = async () => {
  const nombreLimpio = nombre.value.trim()
  if (!nombreLimpio) return

  guardando.value = true

  let error = null
  if (modoEdicion.value) {
    const res = await supabase
      .from('cultivos')
      .update({ nombre: nombreLimpio })
      .eq('id', idSeleccionado.value)
    error = res.error
  } else {
    const res = await supabase
      .from('cultivos')
      .insert([{ nombre: nombreLimpio }])
    error = res.error
  }

  guardando.value = false

  if (error) {
    mostrarNotificacion(parsearErrorSupabase(error), 'error')
  } else {
    mostrarNotificacion(
      modoEdicion.value ? 'Cultivo actualizado correctamente.' : 'Cultivo registrado con éxito.',
      'exito'
    )
    cerrarModal()
    cargarCultivos()
  }
}

const confirmarEliminar = async () => {
  if (!cultivoAEliminar.value) return

  eliminando.value = true

  const { error } = await supabase
    .from('cultivos')
    .delete()
    .eq('id', cultivoAEliminar.value.id)

  eliminando.value = false

  if (error) {
    mostrarNotificacion(parsearErrorSupabase(error), 'error')
  } else {
    mostrarNotificacion('Cultivo eliminado permanentemente.', 'exito')
    cerrarModalEliminar()
    cargarCultivos()
  }
}

onMounted(() => {
  verificarAccesoAdmin()
  cargarCultivos()
})

</script>

<style scoped>
.cultivos-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  margin-top: 10vh;
  padding: 1rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #0F172A;
}

/* Toast Notifications */
.toast-notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  left: 1rem;
  max-width: 400px;
  margin: 0 auto;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  font-size: 0.875rem;
  font-weight: 500;
}

.toast-notification.error {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  color: #991B1B;
}

.toast-notification.exito {
  background: #F0FDF4;
  border: 1px solid #86EFAC;
  color: #166534;
}

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toast-message {
  flex-grow: 1;
}

.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  display: flex;
  opacity: 0.7;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* Banner Error Carga */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  color: #92400E;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.banner-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
  color: #D97706;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.banner-content p {
  margin: 0;
}

.btn-retry {
  background: #D97706;
  color: white;
  border: none;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-group h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #1E293B;
}

.count-badge {
  background: #E8F5E9;
  color: #388E3C;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #388E3C;
  color: white;
  border: none;
  padding: 0.55rem 0.9rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.search-icon {
  font-size: 1.1rem;
  color: #94A3B8;
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
  background: transparent;
  color: #1E293B;
}

.btn-clear {
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.btn-clear:hover {
  color: #64748B;
}

.cultivos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.6rem;
}

.cultivo-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.cultivo-icon {
  font-size: 1.3rem;
  color: #388E3C;
  flex-shrink: 0;
}

.cultivo-nombre {
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  gap: 0.2rem;
  flex-shrink: 0;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 0.3rem;
  border-radius: 6px;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-edit:hover { color: #2563EB; background: #EFF6FF; }
.btn-delete:hover { color: #DC2626; background: #FEE2E2; }

.empty-state, .loading-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #94A3B8;
  background: white;
  border: 1px dashed #CBD5E1;
  border-radius: 12px;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

/* Modales */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-box {
  background: white;
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.modal-box h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #1E293B;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1.2rem;
}

.input-group label {
  font-size: 0.825rem;
  font-weight: 600;
  color: #475569;
}

.input-group input {
  padding: 0.65rem;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
}

.input-group input:focus {
  border-color: #388E3C;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.btn-cancel {
  background: #F1F5F9;
  border: none;
  padding: 0.65rem;
  border-radius: 8px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-save {
  background: #388E3C;
  color: white;
  border: none;
  padding: 0.65rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:disabled, .btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Eliminación */
.modal-delete {
  text-align: center;
}

.delete-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #FEF2F2;
  color: #DC2626;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-bottom: 0.75rem;
}

.delete-warning-icon {
  font-size: 1.75rem;
}

.modal-delete h3 {
  margin-bottom: 0.4rem;
}

.delete-description {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0 0 1.25rem 0;
  line-height: 1.4;
}

.btn-confirm-delete {
  background: #DC2626;
  color: white;
  border: none;
  padding: 0.65rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>