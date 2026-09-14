<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

const router = useRouter()
const CACHE_KEY = 'vagrop_tecnicos_cache'

const tecnicos = ref([])
const cargando = ref(true)
const guardando = ref(false)
const modalAbierto = ref(false)
const modoEdicion = ref(false)
const busqueda = ref('')

// Formulario reactivo
const form = ref({
  id: null,
  nombre: '',
  telefono: '',
  sucursal: 'Nueva Guinea',
  activo: true
})

// Verificar permisos de Administrador al cargar la vista
const verificarAccesoAdmin = () => {
  const rolUsuario = localStorage.getItem('vagrop_rol')
  // Si no es administrador, redirigimos fuera de la gestión de técnicos
  if (rolUsuario !== 'admin') {
    alert('Acceso denegado: Se requieren permisos de administrador.')
    router.push('/productores')
  }
}

// Cargar de Caché Local para rendimiento instantáneo con mala señal
const cargarCacheLocal = () => {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      tecnicos.value = JSON.parse(cached)
      cargando.value = false
    } catch (e) {
      console.error('Error parseando caché:', e)
    }
  }
}

// Obtener técnicos de Supabase
const obtenerTecnicos = async () => {
  cargarCacheLocal()

  const { data, error } = await supabase
    .from('tecnicos')
    .select('*')
    .order('nombre', { ascending: true })

  if (!error && data) {
    tecnicos.value = data
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } else if (error && tecnicos.value.length === 0) {
    alert('Error de conexión: ' + error.message)
  }
  cargando.value = false
}

// Filtro rápido en memoria
const tecnicosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return tecnicos.value
  const query = busqueda.value.toLowerCase()
  return tecnicos.value.filter(t => 
    t.nombre.toLowerCase().includes(query) || 
    t.sucursal.toLowerCase().includes(query) ||
    (t.telefono && t.telefono.includes(query))
  )
})

// Acciones Directas de Comunicación
const limpiarTelefono = (tel) => tel ? tel.replace(/[^0-9]/g, '') : ''

const abrirWhatsApp = (telefono, nombre) => {
  const num = limpiarTelefono(telefono)
  if (!num) return alert('El técnico no tiene número registrado')
  const fullNum = num.length === 8 ? `505${num}` : num
  const mensaje = encodeURIComponent(`Hola ${nombre}, te contacto desde el sistema agrícola.`)
  window.open(`https://wa.me/${fullNum}?text=${mensaje}`, '_blank')
}

const llamarTecnico = (telefono) => {
  const num = limpiarTelefono(telefono)
  if (!num) return alert('El técnico no tiene número registrado')
  window.location.href = `tel:${num}`
}

// Control del Modal
const abrirModal = (tecnico = null) => {
  if (tecnico) {
    modoEdicion.value = true
    form.value = { ...tecnico }
  } else {
    modoEdicion.value = false
    form.value = {
      id: null,
      nombre: '',
      telefono: '',
      sucursal: 'Nueva Guinea',
      activo: true
    }
  }
  modalAbierto.value = true
}

const cerrarModal = () => {
  modalAbierto.value = false
}

// Guardar Técnico (Insert / Update)
const guardarTecnico = async () => {
  if (!form.value.nombre.trim()) return

  guardando.value = true
  const payload = {
    nombre: form.value.nombre.trim(),
    telefono: form.value.telefono ? form.value.telefono.trim() : '',
    sucursal: form.value.sucursal,
    activo: form.value.activo
  }

  let error = null
  if (modoEdicion.value) {
    const res = await supabase.from('tecnicos').update(payload).eq('id', form.value.id)
    error = res.error
  } else {
    const res = await supabase.from('tecnicos').insert([payload])
    error = res.error
  }

  guardando.value = false
  if (error) {
    alert('Error al guardar: ' + error.message)
  } else {
    cerrarModal()
    obtenerTecnicos()
  }
}

// Cambiar estado Activo/Inactivo con actualización instantánea
// Cambiar estado Activo/Inactivo con actualización instantánea y cierre de sesión si aplica
const toggleEstado = async (tecnico) => {
  const nuevoEstado = !tecnico.activo
  tecnico.activo = nuevoEstado
  localStorage.setItem(CACHE_KEY, JSON.stringify(tecnicos.value))

  const { error } = await supabase
    .from('tecnicos')
    .update({ activo: nuevoEstado })
    .eq('id', tecnico.id)

  if (error) {
    tecnico.activo = !nuevoEstado
    alert('No se pudo actualizar en la base de datos (revisa tu señal).')
    return
  }

  // Si el técnico desactivado es el usuario actual en este dispositivo, cerramos su sesión de inmediato
  const usuarioActualId = localStorage.getItem('vagrop_user_id')
  if (usuarioActualId && Number(usuarioActualId) === Number(tecnico.id) && !nuevoEstado) {
    localStorage.removeItem('vagrop_user_id')
    localStorage.removeItem('vagrop_nombre')
    localStorage.removeItem('vagrop_rol')
    localStorage.removeItem('vagrop_sucursal')
    await supabase.auth.signOut()
    alert('Tu cuenta ha sido desactivada por el administrador.')
    router.push('/login')
  }
}
onMounted(() => {
  verificarAccesoAdmin()
  obtenerTecnicos()
})
</script>

<template>
  <div class="app-wrapper">
    <!-- Header Minimalista -->
    <header class="app-header">
      <div class="header-title">
        <h1>Técnicos</h1>
        <span class="count-badge">{{ tecnicosFiltrados.length }}</span>
      </div>
      <button class="btn-fab-header" @click="abrirModal()">
        <Icon icon="ph:plus-bold" class="btn-icon" />
        Nuevo
      </button>
    </header>

    <!-- Barra de Búsqueda -->
    <div class="search-bar">
      <Icon icon="ph:magnifying-glass-bold" class="search-icon" />
      <input v-model="busqueda" type="text" placeholder="Buscar por nombre, sucursal o teléfono..." />
    </div>

    <!-- Indicador de Carga -->
    <div v-if="cargando && tecnicos.length === 0" class="skeleton-loader">
      <div class="skeleton-card" v-for="i in 3" :key="i"></div>
    </div>

    <!-- Lista de Tarjetas Móviles -->
    <main v-else class="cards-list">
      <div 
        v-for="t in tecnicosFiltrados" 
        :key="t.id" 
        class="tech-card"
        :class="{ 'inactive-card': !t.activo }"
      >
        <!-- Fila Superior: Info + Toggle Check con Etiqueta -->
        <div class="card-main-info">
          <div class="user-avatar" :class="{ 'avatar-off': !t.activo }">
            {{ t.nombre.charAt(0).toUpperCase() }}
          </div>
          <div class="user-details">
            <div class="name-row">
              <h3 @click="abrirModal(t)">{{ t.nombre }}</h3>
            </div>
            <p class="sucursal-tag">
              <Icon icon="ph:map-pin-bold" class="inline-icon" /> {{ t.sucursal }}
            </p>
            <!-- Muestra del número de teléfono -->
            <p class="phone-tag">
              <Icon icon="ph:phone-fill" class="inline-icon" />
              <span v-if="t.telefono">{{ t.telefono }}</span>
              <span v-else class="no-phone">Sin teléfono</span>
            </p>
          </div>

          <!-- Switch / Check con Texto Explicativo -->
          <div class="status-toggle-wrapper">
            <span :class="['status-label', t.activo ? 'text-active' : 'text-inactive']">
              {{ t.activo ? 'Activo' : 'Inactivo' }}
            </span>
            <label class="switch" :title="t.activo ? 'Desactivar técnico' : 'Activar técnico'">
              <input 
                type="checkbox" 
                :checked="t.activo" 
                @change="toggleEstado(t)"
              />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Fila Inferior: Botones de Acción (3 columnas alineadas) -->
        <div class="card-actions-row">
          <button 
            class="action-btn btn-call" 
            :disabled="!t.telefono"
            @click="llamarTecnico(t.telefono)"
          >
            <Icon icon="ph:phone-fill" class="action-icon" />
            Llamar
          </button>

          <button 
            class="action-btn btn-ws" 
            :disabled="!t.telefono"
            @click="abrirWhatsApp(t.telefono, t.nombre)"
          >
            <Icon icon="ph:whatsapp-logo-fill" class="action-icon" />
            WhatsApp
          </button>

          <button class="action-btn btn-edit" @click="abrirModal(t)">
            <Icon icon="ph:pencil-simple-line-fill" class="action-icon" />
            Editar
          </button>
        </div>
      </div>
    </main>

    <!-- Modal Formulario Bottom Sheet -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <h2>{{ modoEdicion ? 'Editar Técnico' : 'Nuevo Técnico' }}</h2>
        
        <form @submit.prevent="guardarTecnico" class="sheet-form">
          <div class="input-group">
            <label>Nombre Completo</label>
            <input v-model="form.nombre" type="text" placeholder="Ej. Bayardo Solís" required />
          </div>

          <div class="input-group">
            <label>Teléfono / WhatsApp</label>
            <input v-model="form.telefono" type="tel" placeholder="Ej. 88888888" />
          </div>

          <!-- Selección de Sucursal con Botones Táctiles -->
          <div class="input-group">
            <label>Sucursal Asignada</label>
            <div class="segmented-control">
              <button 
                type="button" 
                :class="{ active: form.sucursal === 'Nueva Guinea' }"
                @click="form.sucursal = 'Nueva Guinea'"
              >
                Nueva Guinea
              </button>
              <button 
                type="button" 
                :class="{ active: form.sucursal === 'Rama' }"
                @click="form.sucursal = 'Rama'"
              >
                Rama
              </button>
              <button 
                type="button" 
                :class="{ active: form.sucursal === 'Ambas' }"
                @click="form.sucursal = 'Ambas'"
              >
                Ambas
              </button>
            </div>
          </div>

          <!-- Switch Estado en Formulario -->
          <div class="input-group switch-row">
            <span>Técnico Operativo / Activo</span>
            <label class="switch">
              <input type="checkbox" v-model="form.activo" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="sheet-actions">
            <button type="button" class="btn-cancel" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Técnico' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  max-width: 600px;
  margin: 0 auto;
  margin-top: 10vh;
  margin-bottom: 5vh;
  padding: 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0F172A;
  background-color: #F8FAFC;
  min-height: 100vh;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-title h1 {
  font-size: 1.5rem;
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

.btn-fab-header {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background-color: #388E3C;
  color: white;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(56, 142, 60, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Buscador */
.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 0.6rem 0.8rem;
  margin-bottom: 1.2rem;
  gap: 0.5rem;
}

.search-icon {
  font-size: 1.2rem;
  color: #94A3B8;
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.95rem;
  background: transparent;
}

/* Tarjeta de Técnico */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.tech-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.inactive-card {
  opacity: 0.65;
  background-color: #F1F5F9;
}

.card-main-info {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #E8F5E9;
  color: #388E3C;
  font-weight: 700;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.avatar-off {
  background: #E2E8F0;
  color: #64748B;
}

.user-details {
  flex-grow: 1;
}

.user-details h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0F172A;
  cursor: pointer;
}

.sucursal-tag, .phone-tag {
  margin: 0.2rem 0 0 0;
  font-size: 0.825rem;
  color: #64748B;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.phone-tag {
  font-weight: 500;
  color: #334155;
}

.no-phone {
  color: #94A3B8;
  font-style: italic;
  font-weight: normal;
}

.inline-icon {
  font-size: 0.9rem;
  color: #64748B;
}

/* Status y Switch */
.status-toggle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.status-label {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.text-active {
  color: #388E3C;
}

.text-inactive {
  color: #94A3B8;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #CBD5E1;
  transition: .2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #388E3C;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* Fila de Botones Ajustados a 3 Columnas */
.card-actions-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  margin-top: 0.8rem;
  padding-top: 0.75rem;
  border-top: 1px solid #F1F5F9;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.55rem 0.2rem;
  border-radius: 10px;
  border: none;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-call { background-color: #F0FDF4; color: #166534; }
.btn-ws { background-color: #DCFCE7; color: #15803D; }
.btn-edit { background-color: #F1F5F9; color: #475569; }

.action-icon {
  font-size: 1.05rem;
}

/* Modal Bottom Sheet */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.bottom-sheet {
  background: white;
  width: 100%;
  max-width: 500px;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 1.2rem 1.5rem 3.5rem 1.5rem;
  box-shadow: 0 -10px 25px rgba(0,0,0,0.1);
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  margin: 0 auto 1rem auto;
}

.bottom-sheet h2 {
  margin: 0 0 1.2rem 0;
  font-size: 1.2rem;
  color: #0F172A;
}

.input-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.input-group input {
  padding: 0.75rem;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
}

.input-group input:focus {
  border-color: #388E3C;
  box-shadow: 0 0 0 2px rgba(56, 142, 60, 0.15);
}

.segmented-control {
  display: flex;
  background: #F1F5F9;
  padding: 3px;
  border-radius: 12px;
  gap: 3px;
}

.segmented-control button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.65rem 0.3rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
}

.segmented-control button.active {
  background: white;
  color: #388E3C;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.switch-row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-cancel {
  background: #F1F5F9;
  border: none;
  padding: 0.8rem;
  border-radius: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-save {
  background: #388E3C;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}

/* Skeleton Loading */
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.skeleton-card {
  height: 90px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 16px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>