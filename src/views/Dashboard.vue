<template>
  <div class="dashboard-wrapper">
    <!-- HEADER DEL DASHBOARD -->
    <header class="dash-header">
      <div class="dash-title-group">
        <h1>Panel General</h1>
        <p class="dash-subtitle">Resumen operativo y métricas</p>
      </div>
      <button class="btn-refresh" @click="cargarDatos" :disabled="cargando">
        <Icon icon="ph:arrow-clockwise-bold" :class="{ 'spin': cargando }" />
        <span>Actualizar</span>
      </button>
    </header>

    <!-- ESTADO DE CARGA / VACÍO -->
    <div v-if="cargando && productores.length === 0" class="loading-state">
      <Icon icon="ph:spinner-gap-bold" class="spinner-icon" />
      <p>Cargando métricas...</p>
    </div>

    <template v-else>
      <!-- TARJETAS KPI PRINCIPALES (2 columnas fijas en móvil) -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-box indigo">
            <Icon icon="ph:users-three-bold" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Productores</span>
            <h2 class="kpi-value">{{ totalProductores }}</h2>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box emerald">
            <Icon icon="ph:plant-bold" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Área Total</span>
            <h2 class="kpi-value">{{ totalManzanas.toLocaleString() }} <span class="unit">Mz</span></h2>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box orange">
            <Icon icon="ph:grains-bold" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Est. Cosecha</span>
            <h2 class="kpi-value">{{ totalEstimadoCosecha.toLocaleString() }} <span class="unit">qq</span></h2>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box violet">
            <Icon icon="ph:user-gear-bold" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Técnicos</span>
            <h2 class="kpi-value">{{ tecnicos.length }}</h2>
          </div>
        </div>
      </section>

      <!-- SECCIÓN DE GRÁFICOS -->
      <section class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3>Productores por Técnico</h3>
            <Icon icon="ph:user-list-bold" class="header-icon" />
          </div>
          <div class="chart-container">
            <Bar :data="chartDataTecnicos" :options="chartOptionsBar" />
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3>Productores por Cultivo</h3>
            <Icon icon="ph:chart-donut-bold" class="header-icon" />
          </div>
          <div class="chart-container donut-container">
            <Doughnut :data="chartDataCultivos" :options="chartOptionsDoughnut" />
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3>Manzanas (Mz) por Cultivo</h3>
            <Icon icon="ph:chart-bar-horizontal-bold" class="header-icon" />
          </div>
          <div class="chart-container">
            <Bar :data="chartDataManzanasCultivo" :options="chartOptionsHorizontal" />
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3>Distribución por Sucursal</h3>
            <Icon icon="ph:storefront-bold" class="header-icon" />
          </div>
          <div class="chart-container donut-container">
            <Pie :data="chartDataSucursales" :options="chartOptionsDoughnut" />
          </div>
        </div>
      </section>

      <!-- SECCIÓN AVANZADA: LÍDERES POR CULTIVO (2 COLUMNAS ESTRICTAS) -->
      <section class="advanced-section">
        <div class="section-header-box">
          <Icon icon="ph:trophy-bold" class="trophy-icon" />
          <div>
            <h3>Líderes de Área por Cultivo</h3>
            <p>Mayor superficie registrada</p>
          </div>
        </div>

        <div class="leaders-grid" v-if="topProductoresPorCultivo.length > 0">
          <div v-for="item in topProductoresPorCultivo" :key="item.cultivo" class="leader-card">
            <div class="leader-cultivo-badge">
              <Icon icon="ph:plant-duotone" />
              <span>{{ item.cultivo }}</span>
            </div>
            <div class="leader-info">
              <h4 class="leader-name">{{ item.productor }}</h4>
              <p class="leader-comunidad">
                <Icon icon="ph:map-pin-bold" /> {{ item.comunidad }}
              </p>
              <div class="leader-stats">
                <span>Área: <b>{{ item.manzanas }} Mz</b></span>
                <span v-if="item.rendimiento">Rend: <b>{{ item.rendimiento }} qq/mz</b></span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-leaders">
          <p>No hay suficientes datos registrados.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar, Doughnut, Pie } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
)

const CACHE_TEC_KEY = 'vagrop_tecnicos_cache'
const CACHE_PROD_KEY = 'vagrop_productores_cache'

const productores = ref([])
const tecnicos = ref([])
const cargando = ref(true)

const cargarCache = () => {
  const cachedProds = localStorage.getItem(CACHE_PROD_KEY)
  const cachedTecs = localStorage.getItem(CACHE_TEC_KEY)
  if (cachedProds) productores.value = JSON.parse(cachedProds)
  if (cachedTecs) tecnicos.value = JSON.parse(cachedTecs)
  if (cachedProds || cachedTecs) cargando.value = false
}

const cargarDatos = async () => {
  cargando.value = true
  cargarCache()

  try {
    const [resTecnicos, resProductores] = await Promise.all([
      supabase.from('tecnicos').select('id, nombre, sucursal').eq('activo', true),
      supabase.from('productores').select('*, tecnicos:tecnico_id(id, nombre)')
    ])

    if (!resTecnicos.error && resTecnicos.data) {
      tecnicos.value = resTecnicos.data
      localStorage.setItem(CACHE_TEC_KEY, JSON.stringify(resTecnicos.data))
    }
    if (!resProductores.error && resProductores.data) {
      productores.value = resProductores.data
      localStorage.setItem(CACHE_PROD_KEY, JSON.stringify(resProductores.data))
    }
  } catch (err) {
    console.error('Error al sincronizar dashboard:', err)
  } finally {
    cargando.value = false
  }
}

const totalProductores = computed(() => productores.value.length)

const totalManzanas = computed(() => {
  let total = 0
  productores.value.forEach(p => {
    if (Array.isArray(p.cultivos)) {
      p.cultivos.forEach(c => { total += Number(c.manzanas) || 0 })
    }
  })
  return Math.round(total * 100) / 100
})

const totalEstimadoCosecha = computed(() => {
  let total = 0
  productores.value.forEach(p => {
    if (Array.isArray(p.cultivos)) {
      p.cultivos.forEach(c => {
        const mz = Number(c.manzanas) || 0
        const qqMz = Number(c.estimado_qq_mz) || 0
        total += mz * qqMz
      })
    }
  })
  return Math.round(total)
})

const chartDataTecnicos = computed(() => {
  const conteo = {}
  tecnicos.value.forEach(t => { conteo[t.nombre] = 0 })

  productores.value.forEach(p => {
    const nombreTec = p.tecnicos?.nombre || 'Sin Asignar'
    conteo[nombreTec] = (conteo[nombreTec] || 0) + 1
  })

  return {
    labels: Object.keys(conteo),
    datasets: [{
      label: 'Productores',
      data: Object.values(conteo),
      backgroundColor: '#4F46E5',
      borderRadius: 6
    }]
  }
})

const chartDataCultivos = computed(() => {
  const conteo = {}
  productores.value.forEach(p => {
    if (Array.isArray(p.cultivos)) {
      p.cultivos.forEach(c => {
        if (c.nombre) conteo[c.nombre] = (conteo[c.nombre] || 0) + 1
      })
    }
  })

  return {
    labels: Object.keys(conteo),
    datasets: [{
      data: Object.values(conteo),
      backgroundColor: ['#059669', '#2563EB', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D']
    }]
  }
})

const chartDataManzanasCultivo = computed(() => {
  const manzanasPorCultivo = {}
  productores.value.forEach(p => {
    if (Array.isArray(p.cultivos)) {
      p.cultivos.forEach(c => {
        if (c.nombre) {
          manzanasPorCultivo[c.nombre] = (manzanasPorCultivo[c.nombre] || 0) + (Number(c.manzanas) || 0)
        }
      })
    }
  })

  return {
    labels: Object.keys(manzanasPorCultivo),
    datasets: [{
      label: 'Manzanas (Mz)',
      data: Object.values(manzanasPorCultivo),
      backgroundColor: '#0D9488',
      borderRadius: 6
    }]
  }
})

const chartDataSucursales = computed(() => {
  const sucursales = { 'Nueva Guinea': 0, 'La Rama': 0 }
  productores.value.forEach(p => {
    const suc = p.sucursal === 'Rama' ? 'La Rama' : 'Nueva Guinea'
    sucursales[suc] = (sucursales[suc] || 0) + 1
  })

  return {
    labels: Object.keys(sucursales),
    datasets: [{
      data: Object.values(sucursales),
      backgroundColor: ['#2563EB', '#10B981']
    }]
  }
})

const topProductoresPorCultivo = computed(() => {
  const mapaCultivos = {}
  productores.value.forEach(p => {
    if (Array.isArray(p.cultivos)) {
      p.cultivos.forEach(c => {
        if (!c.nombre) return
        const mz = Number(c.manzanas) || 0

        if (!mapaCultivos[c.nombre] || mz > mapaCultivos[c.nombre].manzanas) {
          mapaCultivos[c.nombre] = {
            cultivo: c.nombre,
            productor: p.nombre,
            comunidad: p.comunidad || 'Sin comunidad',
            manzanas: mz,
            rendimiento: c.estimado_qq_mz || null
          }
        }
      })
    }
  })
  return Object.values(mapaCultivos)
})

const chartOptionsBar = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { font: { size: 9 } } },
    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 30 } }
  }
}

const chartOptionsHorizontal = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { font: { size: 9 } } },
    y: { grid: { display: false }, ticks: { font: { size: 9 } } }
  }
}

const chartOptionsDoughnut = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 8, font: { size: 9 }, color: '#334155' }
    }
  }
}

onMounted(() => { cargarDatos() })
</script>

<style scoped>
/* Contenedor principal fluido */
.dashboard-wrapper {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0.75rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0F172A;
  background-color: #F8FAFC;
  box-sizing: border-box;
  padding-bottom: 6rem;
  overflow-x: hidden;
}

/* Header */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.dash-title-group h1 {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0;
  color: #0F172A;
}

.dash-subtitle {
  font-size: 0.7rem;
  color: #64748B;
  margin: 0;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  border: 1px solid #CBD5E1;
  color: #334155;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.7rem;
  cursor: pointer;
  flex-shrink: 0;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* KPI Grid: 2 columnas en móvil, 4 en pantallas grandes */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

.kpi-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-sizing: border-box;
  min-width: 0;
}

.kpi-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.kpi-icon-box.indigo { background: #EEF2FF; color: #4F46E5; }
.kpi-icon-box.emerald { background: #ECFDF5; color: #059669; }
.kpi-icon-box.orange { background: #FFF7ED; color: #D97706; }
.kpi-icon-box.violet { background: #F5F3FF; color: #7C3AED; }

.kpi-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.kpi-label {
  font-size: 0.58rem;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unit { font-size: 0.65rem; font-weight: 600; color: #94A3B8; }

/* GRÁFICOS: 1 columna en móviles, 2 a la par en pantallas grandes */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

@media (min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}

.chart-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0.75rem;
  box-sizing: border-box;
  width: 98%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.chart-header h3 { font-size: 0.8rem; font-weight: 700; color: #1E293B; margin: 0; }
.header-icon { font-size: 0.95rem; color: #94A3B8; }

.chart-container { position: relative; height: 200px; width: 100%; }
.donut-container { height: 180px; }

/* Sección Avanzada: Líderes de Cultivo */
.advanced-section {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0.75rem;
}

.section-header-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 0.4rem;
}

.trophy-icon {
  font-size: 1.3rem;
  color: #D97706;
  background: #FEF3C7;
  padding: 0.25rem;
  border-radius: 6px;
  flex-shrink: 0;
}

.section-header-box h3 { font-size: 0.8rem; font-weight: 700; margin: 0; color: #1E293B; }
.section-header-box p { font-size: 0.65rem; color: #64748B; margin: 0; }

.leaders-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .leaders-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.75rem;
  }
}

.leader-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  box-sizing: border-box;
  min-width: 0;
}

.leader-cultivo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: #E0F2FE;
  color: #0369A1;
  font-size: 0.58rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leader-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.leader-comunidad {
  font-size: 0.62rem;
  color: #64748B;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.leader-stats {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  font-size: 0.6rem;
  color: #475569;
  border-top: 1px dashed #CBD5E1;
  padding-top: 0.25rem;
  margin-top: 0.05rem;
}

.empty-leaders, .loading-state {
  text-align: center;
  padding: 1.2rem;
  color: #94A3B8;
  font-size: 0.75rem;
}

.spinner-icon { font-size: 1.5rem; margin-bottom: 0.3rem; color: #4F46E5; }
</style>