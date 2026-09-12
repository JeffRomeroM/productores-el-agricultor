<template>
  <div class="app-wrapper">
    <!-- SISTEMA DE TOAST NOTIFICATIONS -->
    <Transition name="toast-fade">
      <div v-if="toast.visible" :class="['toast-notification', toast.tipo]">
        <Icon :icon="toast.tipo === 'error' ? 'ph:warning-circle-bold' : 'ph:check-circle-bold'" class="toast-icon" />
        <span>{{ toast.mensaje }}</span>
      </div>
    </Transition>

    <!-- HEADER DE LA APLICACIÓN -->
    <header class="app-header">
      <div class="header-title">
        <h1>Productores</h1>
        <span class="count-badge">{{ productoresFiltrados?.length || 0 }}</span>
      </div>

      <div class="header-actions-group">
        <button class="btn-fab-header" @click="abrirModal()">
          <Icon icon="ph:plus-bold" class="btn-icon" />
          Nuevo
        </button>
      </div>
    </header>

    <!-- BARRA DE BÚSQUEDA Y FILTROS -->
    <section class="filters-container">
      <div class="search-bar">
        <Icon icon="ph:magnifying-glass-bold" class="search-icon" />
        <input 
          v-model="busqueda" 
          type="text" 
          placeholder="Buscar por nombre, comunidad, teléfono..." 
          @input="paginaActual = 1"
        />
        <button v-if="busqueda" class="btn-clear" @click="busqueda = ''; paginaActual = 1">
          <Icon icon="ph:x-bold" />
        </button>
      </div>

      <!-- SELECTORES DE FILTRO -->
      <div class="filter-chips">
        <!-- Filtro Comunidad -->
        <div class="filter-select-wrapper">
          <Icon icon="ph:map-pin-bold" class="select-icon" />
          <select v-model="filtroComunidad" @change="paginaActual = 1">
            <option value="">Todas las Comunidades</option>
            <option v-for="c in comunidadesDisponibles" :key="c" :value="c">
              {{ c }}
            </option>
          </select>
        </div>

        <!-- Filtro Dinámico por Cultivo -->
        <div class="filter-select-wrapper">
          <Icon icon="ph:plant-bold" class="select-icon" />
          <select v-model="filtroCultivo" @change="paginaActual = 1">
            <option value="">Todos los Cultivos</option>
            <option v-for="c in catalogoCultivos" :key="c.id" :value="c.nombre">
              {{ c.nombre }}
            </option>
          </select>
        </div>

        <!-- Filtro Técnico -->
        <div class="filter-select-wrapper">
          <Icon icon="ph:user-gear-bold" class="select-icon" />
          <select v-model="filtroTecnico" @change="paginaActual = 1">
            <option value="">Todos los Técnicos</option>
            <option v-for="t in tecnicos" :key="t.id" :value="t.id">
              {{ t.nombre }}
            </option>
          </select>
        </div>

        <!-- Filtro Sucursal -->
        <div class="filter-select-wrapper">
          <Icon icon="ph:storefront-bold" class="select-icon" />
          <select v-model="filtroSucursal" @change="paginaActual = 1">
            <option value="">Todas las Sucursales</option>
            <option value="Nueva Guinea">Nueva Guinea</option>
            <option value="Rama">La Rama</option>
          </select>
        </div>

        <!-- Botón Limpiar Filtros -->
        <button 
          v-if="filtroComunidad || filtroCultivo || filtroTecnico || filtroSucursal || busqueda" 
          class="btn-reset-filters" 
          @click="limpiarFiltros"
        >
          <Icon icon="ph:funnel-x-bold" /> Limpiar
        </button>
      </div>
    </section>

    <!-- INDICADOR DE CARGA -->
    <div v-if="cargando && (!productores || productores.length === 0)" class="loading-state">
      <Icon icon="ph:spinner-gap-bold" class="spinner-icon" />
      <p>Cargando lista de productores...</p>
    </div>

    <!-- LISTA DE PRODUCTORES (PAGINADA EN 10) -->
    <main v-else-if="productoresPaginados.length > 0" class="cards-list-wrapper">
      <div class="cards-list">
        <div v-for="p in productoresPaginados" :key="p.id" class="prod-card">
          <div class="card-main-info">
            <div class="user-avatar">
              {{ p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P' }}
            </div>
            <div class="user-details">
              <h3 @click="abrirModal(p)">{{ p.nombre }}</h3>
              <p class="meta-tag">
                <Icon icon="ph:map-pin-bold" class="inline-icon" /> 
                <b>{{ p.comunidad }}</b> • {{ p.sucursal }}
              </p>
              <p class="meta-tag">
                <Icon icon="ph:user-gear-bold" class="inline-icon" /> 
                Técnico: {{ p.tecnicos?.nombre || 'Sin Asignar' }}
              </p>
              <p class="phone-tag">
                <Icon icon="ph:phone-fill" class="inline-icon" />
                <span v-if="p.telefono">{{ p.telefono }}</span>
                <span v-else class="no-phone">Sin teléfono</span>
              </p>
            </div>
          </div>

          <!-- Resumen de Cultivos -->
          <div class="cultivos-summary" v-if="p.cultivos && p.cultivos.length > 0">
            <div class="summary-title">
              <Icon icon="ph:plant-duotone" class="title-icon" /> Cultivos Registrados
            </div>
            <div class="cultivos-grid-list">
              <div v-for="(c, idx) in p.cultivos" :key="idx" class="cultivo-item-card">
                <div class="cultivo-item-header">
                  <span class="cultivo-name">{{ c.nombre || 'Cultivo' }}</span>
                  <span class="cultivo-mz">{{ c.manzanas || 0 }} Mz</span>
                </div>
                <div v-if="c.estimado_qq_mz > 0" class="cultivo-item-details">
                  <span>Rendimiento: <b>{{ c.estimado_qq_mz }} qq/mz</b></span>
                  <span>Est. Cosecha: <b>{{ ((Number(c.manzanas) || 0) * (Number(c.estimado_qq_mz) || 0)).toLocaleString() }} qq</b></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="card-actions-row">
            <button class="action-btn btn-call" :disabled="!p.telefono" @click="llamarProductor(p.telefono)">
              <Icon icon="ph:phone-fill" class="action-icon" /> Llamar
            </button>
            <button class="action-btn btn-ws" :disabled="!p.telefono" @click="abrirWhatsApp(p.telefono, p.nombre)">
              <Icon icon="ph:whatsapp-logo-fill" class="action-icon" /> WhatsApp
            </button>
            <button class="action-btn btn-edit" @click="abrirModal(p)">
              <Icon icon="ph:pencil-simple-line-fill" class="action-icon" /> Editar
            </button>
            <button class="action-btn btn-delete" @click="abrirModalEliminar(p)">
              <Icon icon="ph:trash-bold" class="action-icon" /> Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- BARRA DE CONTROLES DE PAGINACIÓN -->
      <div class="pagination-bar">
        <span class="pagination-info">
          Mostrando {{ productoresPaginados.length }} de {{ productoresFiltrados.length }} registros
        </span>
        
        <div class="pagination-controls">
          <button 
            :disabled="paginaActual === 1" 
            @click="paginaActual--" 
            class="btn-page"
          >
            <Icon icon="ph:caret-left-bold" />
            Anterior
          </button>
          
          <span class="page-number">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          
          <button 
            :disabled="paginaActual >= totalPaginas" 
            @click="paginaActual++" 
            class="btn-page"
          >
            Siguiente
            <Icon icon="ph:caret-right-bold" />
          </button>
        </div>
      </div>
    </main>

    <!-- ESTADO VACÍO -->
    <div v-else class="empty-state">
      <Icon icon="ph:users-three-light" class="empty-icon" />
      <p>No se encontraron productores que coincidan con los filtros aplicados.</p>
    </div>

    <!-- MODAL CONFIRMACIÓN DE ELIMINACIÓN -->
    <div v-if="modalEliminarAbierto" class="modal-overlay-center" @click.self="cerrarModalEliminar">
      <div class="modal-box modal-delete">
        <div class="delete-icon-wrapper">
          <Icon icon="ph:trash-bold" class="delete-warning-icon" />
        </div>
        <h3>¿Eliminar productor?</h3>
        <p class="delete-description">
          ¿Estás seguro de que deseas eliminar a <strong>"{{ productorAEliminar?.nombre }}"</strong>? Esta acción borrará el registro de la base de datos de forma permanente.
        </p>
        <div class="modal-actions-delete">
          <button type="button" class="btn-cancel" @click="cerrarModalEliminar" :disabled="eliminando">
            Cancelar
          </button>
          <button type="button" class="btn-confirm-delete" @click="confirmarEliminar" :disabled="eliminando">
            {{ eliminando ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FORMULARIO BOTTOM SHEET -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <h2>{{ modoEdicion ? 'Editar Productor' : 'Nuevo Productor' }}</h2>
        
        <form @submit.prevent="guardarProductor" class="sheet-form">
          <div class="input-group">
            <label>Nombre del Productor *</label>
            <input v-model="form.nombre" type="text" placeholder="Ej. Don Abelino Romero" required />
          </div>

          <div class="grid-2">
            <div class="input-group">
              <label>Comunidad *</label>
              <input 
                v-model="form.comunidad" 
                type="text" 
                list="list-comunidades"
                placeholder="Ej. La Esperanza" 
                @blur="form.comunidad = formatearComunidad(form.comunidad)"
                required 
              />
              <datalist id="list-comunidades">
                <option v-for="c in comunidadesDisponibles" :key="c" :value="c" />
              </datalist>
            </div>

            <!-- Entrada de Teléfono -->
            <div class="input-group">
              <label>Teléfono (8 dígitos NI)</label>
              <input 
                :value="form.telefono" 
                @input="validarTelefonoInput" 
                type="tel" 
                placeholder="88888888" 
                maxlength="8"
              />
              <span v-if="errorTelefono" class="error-text">{{ errorTelefono }}</span>
            </div>
          </div>

          <!-- Selección de Técnico -->
          <div class="input-group">
            <label>Técnico Responsable *</label>
            <div class="tecnicos-selector">
              <button
                v-for="t in tecnicos"
                :key="t.id"
                type="button"
                class="btn-tecnico"
                :class="{ active: form.tecnico_id === t.id }"
                @click="seleccionarTecnico(t)"
              >
                <Icon icon="ph:user-circle-bold" class="tec-icon" />
                <div class="tec-info">
                  <span class="tec-name">{{ t.nombre }}</span>
                  <span class="tec-branch">{{ t.sucursal }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Sucursal -->
          <div class="input-group">
            <div class="label-with-badge">
              <label>Sucursal Asignada</label>
              <span v-if="!esSucursalEditable && form.tecnico_id" class="badge-auto">Automática</span>
            </div>
            <div class="segmented-control" :class="{ disabled: !esSucursalEditable }">
              <button 
                type="button" 
                :class="{ active: form.sucursal === 'Nueva Guinea' }"
                :disabled="!esSucursalEditable"
                @click="form.sucursal = 'Nueva Guinea'"
              >
                Nueva Guinea
              </button>
              <button 
                type="button" 
                :class="{ active: form.sucursal === 'Rama' }"
                :disabled="!esSucursalEditable"
                @click="form.sucursal = 'Rama'"
              >
                Rama
              </button>
            </div>
          </div>

          <!-- Sección Dinámica de Cultivos -->
          <div class="cultivos-section">
            <div class="cultivos-header">
              <label>Cultivos y Estimado de Cosecha</label>
              <button type="button" class="btn-add-cultivo" @click="agregarCultivo">
                <Icon icon="ph:plus-bold" /> Agregar
              </button>
            </div>

            <div v-if="!form.cultivos || form.cultivos.length === 0" class="empty-cultivos-msg">
              Sin cultivos registrados. Toca "+ Agregar" para añadir uno.
            </div>

            <div v-for="(cultivoItem, index) in form.cultivos" :key="index" class="cultivo-row">
              <div class="cultivo-inputs">
                <div class="field-item field-nombre">
                  <span class="field-label">Cultivo</span>
                  <select v-model="cultivoItem.nombre" class="select-cultivo" required>
                    <option value="" disabled>Seleccione...</option>
                    <option v-for="c in catalogoCultivos" :key="c.id" :value="c.nombre">
                      {{ c.nombre }}
                    </option>
                  </select>
                </div>
                <div class="field-item field-mz">
                  <span class="field-label">Área (Mz)</span>
                  <input 
                    v-model.number="cultivoItem.manzanas" 
                    type="number" 
                    step="any" 
                    placeholder="0.0" 
                    required 
                  />
                </div>
                <div class="field-item field-qq">
                  <span class="field-label">Qq/Mz</span>
                  <input 
                    v-model.number="cultivoItem.estimado_qq_mz" 
                    type="number" 
                    step="any" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <button 
                type="button" 
                class="btn-remove-cultivo"
                @click="eliminarCultivo(index)"
                title="Eliminar cultivo"
              >
                <Icon icon="ph:trash-bold" />
              </button>
            </div>
          </div>

          <div class="sheet-actions">
            <button type="button" class="btn-cancel" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="guardando || !form.tecnico_id || errorTelefono !== ''">
              {{ guardando ? 'Guardando...' : 'Guardar Productor' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

const CACHE_TECNICOS_KEY = 'vagrop_tecnicos_cache'
const CACHE_PRODUCTORES_KEY = 'vagrop_productores_cache'
const CACHE_CULTIVOS_KEY = 'vagrop_cultivos_catalogo_cache'

const productores = ref([])
const tecnicos = ref([])
const catalogoCultivos = ref([])
const cargando = ref(true)
const guardando = ref(false)
const eliminando = ref(false)

const modalAbierto = ref(false)
const modoEdicion = ref(false)

const modalEliminarAbierto = ref(false)
const productorAEliminar = ref(null)

// ESTADOS DE FILTROS Y PAGINACIÓN
const busqueda = ref('')
const filtroComunidad = ref('')
const filtroCultivo = ref('')
const filtroTecnico = ref('')
const filtroSucursal = ref('')

const paginaActual = ref(1)
const porPagina = ref(10) // Paginación ajustada a 10 por página

const errorTelefono = ref('')

// SISTEMA LIGERO DE TOAST NOTIFICATIONS
const toast = ref({
  visible: false,
  mensaje: '',
  tipo: 'success'
})
let toastTimer = null

const showToast = (mensaje, tipo = 'success') => {
  toast.value = { visible: true, mensaje, tipo }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 3500)
}

const form = ref({
  id: null,
  nombre: '',
  comunidad: '',
  telefono: '',
  tecnico_id: null,
  sucursal: 'Nueva Guinea',
  cultivos: []
})

const parsearErrorSupabase = (error) => {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '23503') return 'No se puede eliminar: el productor tiene visitas o registros vinculados.'
  if (error.code === 'PGRST301' || error.message?.includes('FetchError') || !navigator.onLine) {
    return 'Sin conexión. Se cargaron los datos locales.'
  }
  return error.message || 'Error en la operación.'
}

const cargarCacheLocal = () => {
  const cachedProds = localStorage.getItem(CACHE_PRODUCTORES_KEY)
  const cachedTecs = localStorage.getItem(CACHE_TECNICOS_KEY)
  const cachedCults = localStorage.getItem(CACHE_CULTIVOS_KEY)

  if (cachedProds) productores.value = JSON.parse(cachedProds)
  if (cachedTecs) tecnicos.value = JSON.parse(cachedTecs)
  if (cachedCults) catalogoCultivos.value = JSON.parse(cachedCults)

  if (cachedProds || cachedTecs || cachedCults) cargando.value = false
}

const cargarDatos = async () => {
  cargarCacheLocal()

  try {
    const [resTecnicos, resProductores, resCultivos] = await Promise.all([
      supabase.from('tecnicos').select('id, nombre, sucursal, activo').eq('activo', true).order('nombre'),
      supabase.from('productores').select('*, tecnicos:tecnico_id(id, nombre, sucursal)').order('created_at', { ascending: false }),
      supabase.from('cultivos').select('id, nombre, activo').eq('activo', true).order('nombre')
    ])

    if (!resTecnicos.error && resTecnicos.data) {
      tecnicos.value = resTecnicos.data
      localStorage.setItem(CACHE_TECNICOS_KEY, JSON.stringify(resTecnicos.data))
    }

    if (!resProductores.error && resProductores.data) {
      productores.value = resProductores.data
      localStorage.setItem(CACHE_PRODUCTORES_KEY, JSON.stringify(resProductores.data))
    }

    if (!resCultivos.error && resCultivos.data) {
      catalogoCultivos.value = resCultivos.data
      localStorage.setItem(CACHE_CULTIVOS_KEY, JSON.stringify(resCultivos.data))
    }
  } catch (err) {
    showToast(parsearErrorSupabase(err), 'error')
  } finally {
    cargando.value = false
  }
}

const formatearComunidad = (texto) => {
  if (!texto) return ''
  return texto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const validarTelefonoInput = (e) => {
  let val = e.target.value.replace(/\D/g, '')
  if (val.length > 8) val = val.slice(0, 8)
  form.value.telefono = val

  if (val.length > 0 && val.length < 8) {
    errorTelefono.value = 'El número debe tener exactos 8 dígitos.'
  } else {
    errorTelefono.value = ''
  }
}

const comunidadesDisponibles = computed(() => {
  if (!productores.value) return []
  const mapComunidades = new Map()

  productores.value.forEach(p => {
    if (p.comunidad) {
      const normalizada = formatearComunidad(p.comunidad)
      const key = normalizada.toLowerCase()
      if (!mapComunidades.has(key)) {
        mapComunidades.set(key, normalizada)
      }
    }
  })

  return Array.from(mapComunidades.values()).sort()
})

const productoresFiltrados = computed(() => {
  if (!productores.value || !Array.isArray(productores.value)) return []

  return productores.value.filter(p => {
    const q = busqueda.value.toLowerCase().trim()
    const matchBusqueda = !q || (
      p.nombre?.toLowerCase().includes(q) ||
      p.comunidad?.toLowerCase().includes(q) ||
      p.telefono?.includes(q)
    )

    const matchComunidad = !filtroComunidad.value || 
      (p.comunidad && p.comunidad.toLowerCase().trim() === filtroComunidad.value.toLowerCase().trim())

    const matchCultivo = !filtroCultivo.value || 
      (Array.isArray(p.cultivos) && p.cultivos.some(c => c.nombre === filtroCultivo.value))

    const matchTecnico = !filtroTecnico.value || p.tecnico_id === filtroTecnico.value
    const matchSucursal = !filtroSucursal.value || p.sucursal === filtroSucursal.value

    return matchBusqueda && matchComunidad && matchCultivo && matchTecnico && matchSucursal
  })
})

const totalPaginas = computed(() => 
  Math.ceil(productoresFiltrados.value.length / porPagina.value) || 1
)

const productoresPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  return productoresFiltrados.value.slice(inicio, inicio + porPagina.value)
})

const limpiarFiltros = () => {
  busqueda.value = ''
  filtroComunidad.value = ''
  filtroCultivo.value = ''
  filtroTecnico.value = ''
  filtroSucursal.value = ''
  paginaActual.value = 1
}

const tecnicoSeleccionado = computed(() => {
  return tecnicos.value.find(t => t.id === form.value.tecnico_id) || null
})

const esSucursalEditable = computed(() => {
  return tecnicoSeleccionado.value?.sucursal === 'Ambas'
})

const seleccionarTecnico = (tec) => {
  form.value.tecnico_id = tec.id
  if (tec.sucursal !== 'Ambas') {
    form.value.sucursal = tec.sucursal === 'Rama' ? 'Rama' : 'Nueva Guinea'
  }
}

const agregarCultivo = () => {
  if (!form.value.cultivos) form.value.cultivos = []
  const primerCultivo = catalogoCultivos.value.length > 0 ? catalogoCultivos.value[0].nombre : ''
  form.value.cultivos.push({ nombre: primerCultivo, manzanas: null, estimado_qq_mz: null })
}

const eliminarCultivo = (index) => {
  form.value.cultivos.splice(index, 1)
}

const limpiarTelefono = (tel) => tel ? tel.replace(/[^0-9]/g, '') : ''

const abrirWhatsApp = (telefono, nombre) => {
  const num = limpiarTelefono(telefono)
  if (!num) return showToast('El productor no tiene número registrado', 'error')
  const fullNum = num.length === 8 ? `505${num}` : num
  const mensaje = encodeURIComponent(`Hola ${nombre}, le saludamos de Agroservicio El Agricultor.`)
  window.open(`https://wa.me/${fullNum}?text=${mensaje}`, '_blank')
}

const llamarProductor = (telefono) => {
  const num = limpiarTelefono(telefono)
  if (!num) return showToast('El productor no tiene número registrado', 'error')
  window.location.href = `tel:${num}`
}

const abrirModal = (productor = null) => {
  errorTelefono.value = ''
  if (productor) {
    modoEdicion.value = true
    form.value = { 
      ...productor,
      tecnico_id: productor.tecnico_id || null,
      sucursal: productor.sucursal || 'Nueva Guinea',
      cultivos: Array.isArray(productor.cultivos) ? JSON.parse(JSON.stringify(productor.cultivos)) : []
    }
  } else {
    modoEdicion.value = false
    const primerTecnico = tecnicos.value.length > 0 ? tecnicos.value[0] : null
    let sucursalInicial = 'Nueva Guinea'
    if (primerTecnico && primerTecnico.sucursal !== 'Ambas') {
      sucursalInicial = primerTecnico.sucursal === 'Rama' ? 'Rama' : 'Nueva Guinea'
    }

    form.value = {
      id: null,
      nombre: '',
      comunidad: '',
      telefono: '',
      tecnico_id: primerTecnico ? primerTecnico.id : null,
      sucursal: sucursalInicial,
      cultivos: []
    }
  }
  modalAbierto.value = true
}

const cerrarModal = () => {
  modalAbierto.value = false
}

const abrirModalEliminar = (productor) => {
  productorAEliminar.value = productor
  modalEliminarAbierto.value = true
}

const cerrarModalEliminar = () => {
  modalEliminarAbierto.value = false
  productorAEliminar.value = null
}

const guardarProductor = async () => {
  if (!form.value.nombre.trim() || !form.value.comunidad.trim()) {
    showToast('Por favor complete los campos obligatorios', 'error')
    return
  }

  if (form.value.telefono && form.value.telefono.length !== 8) {
    showToast('El teléfono debe tener 8 dígitos numéricos', 'error')
    return
  }

  if (!form.value.tecnico_id) {
    showToast('Por favor seleccione un técnico responsable', 'error')
    return
  }

  guardando.value = true

  const payload = {
    nombre: form.value.nombre.trim(),
    comunidad: formatearComunidad(form.value.comunidad),
    telefono: form.value.telefono ? form.value.telefono.trim() : '',
    sucursal: form.value.sucursal,
    tecnico_id: form.value.tecnico_id,
    cultivos: form.value.cultivos
  }

  let error = null
  if (modoEdicion.value) {
    const res = await supabase.from('productores').update(payload).eq('id', form.value.id)
    error = res.error
  } else {
    const res = await supabase.from('productores').insert([payload])
    error = res.error
  }

  guardando.value = false
  if (error) {
    showToast(parsearErrorSupabase(error), 'error')
  } else {
    showToast('Productor guardado exitosamente', 'success')
    cerrarModal()
    cargarDatos()
  }
}

const confirmarEliminar = async () => {
  if (!productorAEliminar.value) return

  eliminando.value = true

  const { error } = await supabase
    .from('productores')
    .delete()
    .eq('id', productorAEliminar.value.id)

  eliminando.value = false

  if (error) {
    showToast(parsearErrorSupabase(error), 'error')
  } else {
    showToast('Productor eliminado permanentemente.', 'success')
    cerrarModalEliminar()
    
    // Ajustar página si la actual queda vacía tras eliminar
    if (productoresPaginados.value.length === 1 && paginaActual.value > 1) {
      paginaActual.value--
    }
    
    cargarDatos()
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.app-wrapper {
  max-width: 1024px;
  margin: 0 auto;
  padding: 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0F172A;
  background-color: #F8FAFC;
  min-height: 100vh;
  box-sizing: border-box;
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
  font-size: 1.4rem;
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

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(56, 142, 60, 0.25);
}

/* Filtros */
.filters-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}

.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #CBD5E1;
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
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
}

.btn-clear {
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filter-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0 0.5rem;
  flex: 1 1 calc(25% - 0.4rem);
  min-width: 140px;
}

.select-icon {
  font-size: 1rem;
  color: #64748B;
  margin-right: 0.3rem;
}

.filter-select-wrapper select {
  border: none;
  background: transparent;
  width: 100%;
  padding: 0.5rem 0;
  font-size: 0.8rem;
  color: #334155;
  outline: none;
  cursor: pointer;
}

.btn-reset-filters {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
}

/* Grilla de Cards */
.cards-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cards-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
}

@media (min-width: 768px) {
  .cards-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

.prod-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-main-info {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #E8F5E9;
  color: #388E3C;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details h3 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: #0F172A;
  cursor: pointer;
}

.meta-tag, .phone-tag {
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

.inline-icon {
  font-size: 0.9rem;
  color: #64748B;
}

/* Resumen Cultivos */
.cultivos-summary {
  margin-top: 0.8rem;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 0.65rem;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.title-icon {
  font-size: 0.95rem;
  color: #388E3C;
}

.cultivos-grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.4rem;
}

.cultivo-item-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
}

.cultivo-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cultivo-name {
  font-size: 0.825rem;
  font-weight: 700;
  color: #1E293B;
}

.cultivo-mz {
  font-size: 0.78rem;
  font-weight: 700;
  color: #2E7D32;
  background: #E8F5E9;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.cultivo-item-details {
  display: flex;
  flex-direction: column;
  margin-top: 0.3rem;
  font-size: 0.72rem;
  color: #64748B;
  border-top: 1px dashed #F1F5F9;
  padding-top: 0.25rem;
}

.card-actions-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.3rem;
  margin-top: 0.8rem;
  padding-top: 0.75rem;
  border-top: 1px solid #F1F5F9;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.2rem;
  border-radius: 8px;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-call { background-color: #F0FDF4; color: #166534; }
.btn-ws { background-color: #DCFCE7; color: #15803D; }
.btn-edit { background-color: #F1F5F9; color: #475569; }
.btn-delete { background-color: #FEF2F2; color: #DC2626; }

.btn-edit:hover { background-color: #E2E8F0; }
.btn-delete:hover { background-color: #FEE2E2; }

/* Controles de Paginación */
.pagination-bar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  background: white;
  border: 1px solid #E2E8F0;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #64748B;
}

@media (min-width: 640px) {
  .pagination-bar {
    flex-direction: row;
    justify-content: space-between;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-page {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid #CBD5E1;
  background-color: #ffffff;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.btn-page:hover:not(:disabled) {
  background-color: #F8FAFC;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-number {
  font-weight: 600;
  color: #0F172A;
}

/* Estados */
.empty-state, .loading-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #94A3B8;
  background: white;
  border: 1px dashed #CBD5E1;
  border-radius: 12px;
}

.empty-icon, .spinner-icon {
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
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.modal-overlay-center {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
  padding: 1rem;
}

.modal-box {
  background: white;
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

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
  margin: 0 0 0.4rem 0;
  font-size: 1.1rem;
  color: #1E293B;
}

.delete-description {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0 0 1.25rem 0;
  line-height: 1.4;
}

.modal-actions-delete {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
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

.bottom-sheet {
  background: white;
  width: 100%;
  max-width: 520px;
  max-height: 92vh;
  overflow-y: auto;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 1rem 1.25rem 3.5rem 1.25rem;
  box-shadow: 0 -10px 25px rgba(0,0,0,0.1);
  box-sizing: border-box;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  margin: 0 auto 0.8rem auto;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.input-group {
  margin-bottom: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.label-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge-auto {
  font-size: 0.68rem;
  background: #E2E8F0;
  color: #475569;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.input-group input {
  padding: 0.65rem;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.error-text {
  color: #DC2626;
  font-size: 0.72rem;
}

.tecnicos-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
  margin-top: 0.2rem;
}

.btn-tecnico {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
}

.btn-tecnico.active {
  background: #E8F5E9;
  border-color: #388E3C;
  box-shadow: 0 0 0 1px #388E3C;
}

.tec-icon {
  font-size: 1.4rem;
  color: #64748B;
  flex-shrink: 0;
}

.btn-tecnico.active .tec-icon {
  color: #388E3C;
}

.tec-info {
  display: flex;
  flex-direction: column;
}

.tec-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1E293B;
}

.btn-tecnico.active .tec-name {
  color: #15803D;
}

.tec-branch {
  font-size: 0.72rem;
  color: #64748B;
}

.segmented-control {
  display: flex;
  background: #F1F5F9;
  padding: 3px;
  border-radius: 12px;
  gap: 3px;
}

.segmented-control.disabled {
  opacity: 0.75;
}

.segmented-control button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.55rem;
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

.cultivos-section {
  background: #F8FAFC;
  border: 1px dashed #CBD5E1;
  border-radius: 12px;
  padding: 0.75rem;
  margin: 0.8rem 0;
}

.cultivos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.cultivos-header label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
}

.empty-cultivos-msg {
  font-size: 0.8rem;
  color: #94A3B8;
  text-align: center;
  padding: 0.8rem 0;
}

.btn-add-cultivo {
  background: #E8F5E9;
  color: #388E3C;
  border: none;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.cultivo-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  padding: 0.6rem;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
}

.cultivo-inputs {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr;
  gap: 0.4rem;
  flex-grow: 1;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.field-label {
  font-size: 0.68rem;
  color: #64748B;
  font-weight: 600;
}

.select-cultivo {
  padding: 0.5rem;
  font-size: 0.85rem;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
  background: white;
  outline: none;
}

.cultivo-inputs input {
  padding: 0.5rem;
  font-size: 0.85rem;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
}

.btn-remove-cultivo {
  background: #FEE2E2;
  color: #DC2626;
  border: none;
  padding: 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-cancel {
  background: #F1F5F9;
  border: none;
  padding: 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-save {
  background: #388E3C;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
}

.btn-save:disabled {
  background: #A5D6A7;
  cursor: not-allowed;
}

/* Toast Notifications */
.toast-notification {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.toast-notification.success { background-color: #059669; }
.toast-notification.error { background-color: #DC2626; }
.toast-icon { font-size: 1.2rem; }

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 480px) {
  .filter-select-wrapper { flex: 1 1 100%; }
  .tecnicos-selector { grid-template-columns: 1fr; }
  .grid-2 { grid-template-columns: 1fr; gap: 0; }
  .cultivos-grid-list { grid-template-columns: 1fr; }
  .card-actions-row { grid-template-columns: repeat(2, 1fr); gap: 0.4rem; }
}
</style>