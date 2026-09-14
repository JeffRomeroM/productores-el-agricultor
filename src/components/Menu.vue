<template>
  <!-- HEADER SUPERIOR (BARRA DE NAVEGACIÓN HORIZONTAL EN PC / HEADER COMPACTO EN MÓVIL) -->
  <header class="top-header" :class="{ 'header-hidden': isHidden }">
    <div class="header-left-brand">
      <img src="/logo.png" alt="El agricultor" class="logo-brand" />
      <span class="brand-title">El Agricultor</span>
    </div>

    <!-- MENÚ HORIZONTAL PRINCIPAL (VISIBLE EN PC) -->
    <nav class="desktop-nav-links">
      

      <!-- Solo visibles para Administradores -->
      <template v-if="esAdmin">
        <RouterLink to="/productores" class="desktop-nav-item">
          <Icon icon="ph:users-three-bold" class="nav-icon" />
          <span>Productores</span>
        </RouterLink>

        <RouterLink to="/dashboard" class="desktop-nav-item">
          <Icon icon="ph:squares-four-bold" class="nav-icon" />
          <span>Dashboard</span>  
        </RouterLink>

        <RouterLink to="/cultivos" class="desktop-nav-item">
          <Icon icon="ph:plant-bold" class="nav-icon" />
          <span>Cultivos</span>
        </RouterLink>

        <RouterLink to="/tecnicos" class="desktop-nav-item">
          <Icon icon="mdi:account-hard-hat" class="nav-icon" />
          <span>Técnicos</span>
        </RouterLink>
        <RouterLink to="/nuevo-tecnico" class="desktop-nav-item">
          <Icon icon="ph:user-plus-bold" class="nav-icon" />
          <span>Agregar Técnico</span>
        </RouterLink>
      </template>
    </nav>

    <!-- BLOQUE DE USUARIO Y CIERRE DE SESIÓN EN LA ESQUINA SUPERIOR DERECHA -->
    <div class="user-session-header">
      <div class="user-meta">
        <span class="user-name">{{ nombreUsuario }}</span>
        <span class="user-branch">{{ sucursalUsuario }}</span>
      </div>
      <button @click="abrirModal" class="btn-top-logout" title="Cerrar Sesión">
        <Icon icon="ph:sign-out-bold" />
      </button>
    </div>
  </header>

  <!-- BARRA DE NAVEGACIÓN INFERIOR (SOLO MÓVIL Y EXCLUSIVA PARA ADMINISTRADORES) -->
  <nav class="mobile-bottom-bar" v-if="esAdmin">
    <div class="mobile-nav-links">
      <RouterLink to="/productores" class="nav-item">
        <div class="icon-box">
          <Icon icon="ph:users-three-bold" class="nav-icon" />
        </div>
        <span class="label">Productores</span>
      </RouterLink>

      <RouterLink to="/dashboard" class="nav-item">
        <div class="icon-box">
          <Icon icon="ph:squares-four-bold" class="nav-icon" />
        </div>
        <span class="label">Dashboard</span>
      </RouterLink>

      <RouterLink to="/cultivos" class="nav-item">
        <div class="icon-box">
          <Icon icon="ph:plant-bold" class="nav-icon" />
        </div>
        <span class="label">Cultivos</span>
      </RouterLink>

      <RouterLink to="/tecnicos" class="nav-item">
        <div class="icon-box">
          <Icon icon="mdi:account-hard-hat" class="nav-icon" />
        </div>
        <span class="label">Técnicos</span>
      </RouterLink>
      <RouterLink to="/nuevo-tecnico" class="nav-item">
        <div class="icon-box">
          <Icon icon="ph:user-plus-bold" class="nav-icon" />
        </div>
        <span class="label">Agregar T...</span>
      </RouterLink>

    </div>
  </nav>

  <!-- MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN -->
  <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
    <div class="modal-card">
      <div class="modal-icon-container">
        <Icon icon="ph:warning-circle-fill" class="warning-icon" />
      </div>
      
      <h3>¿Cerrar Sesión?</h3>
      <p class="modal-subtitle">¿Estás seguro que quieres cerrar sesión?</p>

      <div class="modal-actions">
        <button @click="cerrarModal" class="btn-cancelar">Cancelar</button>
        <button @click="ejecutarCerrarSesion" class="btn-confirmar">Sí, Salir</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()
const isHidden = ref(false)
let lastScrollPosition = 0

// Estados de usuario, rol y modal
const showModal = ref(false)
const nombreUsuario = ref('Técnico')
const sucursalUsuario = ref('General')
const esAdmin = ref(false)

onMounted(() => {
  nombreUsuario.value = localStorage.getItem('vagrop_nombre') || 'Usuario'
  sucursalUsuario.value = localStorage.getItem('vagrop_sucursal') || 'TODAS'
  
  const rol = (localStorage.getItem('vagrop_rol') || '').toLowerCase().trim()
  esAdmin.value = (rol === 'admin')

  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleScroll = () => {
  const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop
  if (Math.abs(currentScrollPosition - lastScrollPosition) < 15) return
  if (currentScrollPosition > lastScrollPosition && currentScrollPosition > 60) {
    isHidden.value = true
  } else {
    isHidden.value = false
  }
  lastScrollPosition = currentScrollPosition
}

const abrirModal = () => {
  showModal.value = true
}

const cerrarModal = () => {
  showModal.value = false
}

const ejecutarCerrarSesion = () => {
  localStorage.removeItem('vagrop_user_id')
  localStorage.removeItem('vagrop_nombre')
  localStorage.removeItem('vagrop_rol')
  localStorage.removeItem('vagrop_sucursal')

  showModal.value = false
  router.push('/')
}
</script>

<style scoped>
/* --- HEADER SUPERIOR (PC & MÓVIL) --- */
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid #F1F5F9;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  box-sizing: border-box;
  transition: transform 0.3s ease-in-out;
}

.header-left-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-brand {
  width: 32px;
  height: auto;
}

.brand-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1E293B;
}

/* --- MENÚ HORIZONTAL SUPERIOR (PC) --- */
.desktop-nav-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.desktop-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #64748B;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.desktop-nav-item .nav-icon {
  font-size: 18px;
}

.desktop-nav-item:hover {
  color: #388E3C;
  background: #E8F5E9;
}

.desktop-nav-item.router-link-active {
  color: #388E3C;
  background: #E8F5E9;
  font-weight: 700;
}

/* --- SECCIÓN USUARIO Y SALIR --- */
.user-session-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.1;
}

.user-branch {
  font-size: 0.68rem;
  font-weight: 600;
  color: #059669;
}

.btn-top-logout {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  color: #DC2626;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-top-logout:hover {
  background: #FEE2E2;
  transform: scale(1.05);
}

.header-hidden {
  transform: translateY(-100%);
}

/* --- BARRA INFERIOR MÓVIL (OCULTA EN PC) --- */
.mobile-bottom-bar {
  display: none;
}

/* --- ESTILOS DEL MODAL DE CONFIRMACIÓN --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  text-align: center;
  animation: modalScale 0.2s ease-out;
}

@keyframes modalScale {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-icon-container {
  margin-bottom: 0.75rem;
}

.warning-icon {
  font-size: 48px;
  color: #F59E0B;
}

.modal-card h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 0.35rem 0;
}

.modal-subtitle {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0 0 1rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-cancelar,
.btn-confirmar {
  flex: 1;
  padding: 0.6rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  border: none;
}

.btn-cancelar {
  background: #F1F5F9;
  color: #475569;
}

.btn-cancelar:hover {
  background: #E2E8F0;
}

.btn-confirmar {
  background: #EF4444;
  color: white;
}

.btn-confirmar:hover {
  background: #DC2626;
}

/* --- MEDIA QUERIES PARA MÓVIL --- */
@media (max-width: 768px) {
  .desktop-nav-links {
    display: none;
  }

  .top-header {
    height: 56px;
    padding: 0 1rem;
  }

  .brand-title {
    font-size: 0.85rem;
  }

  .user-name {
    font-size: 0.72rem;
  }

  .user-branch {
    font-size: 0.58rem;
  }

  .btn-top-logout {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  /* Activar barra de navegación inferior solo si es Admin en móviles */
  .mobile-bottom-bar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 54px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid #F1F5F9;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
    z-index: 1100;
    padding: 0 0.5rem;
    align-items: center;
    justify-content: space-around;
  }

  .mobile-nav-links {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
    gap: 0;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    flex: 1;
    height: 100%;
    gap: 2px;
  }

  .icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 28px;
    border-radius: 99px;
    background: transparent;
  }

  .nav-icon {
    font-size: 22px;
    color: #94A3B8;
  }

  .label {
    font-size: 10px;
    font-weight: 600;
    color: #94A3B8;
  }

  .router-link-active .label {
    color: #388E3C;
    font-weight: 700;
  }

  .router-link-active .nav-icon {
    color: #388E3C;
  }
}
</style>