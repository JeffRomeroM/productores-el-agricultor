<template>
  <!-- HEADER MÓVIL SUPERIOR (LOGOTIPO) -->
  <header class="mobile-header" :class="{ 'header-hidden': isHidden }">
    <div class="mobile-header-content">
      <img src="/logo.png" alt="El agricultor" class="logo-mobile" />
      <span class="brand-title">El Agricultor</span>
    </div>
  </header>

  <!-- BARRA DE NAVEGACIÓN (SIDEBAR EN DESKTOP / BOTTOM BAR EN MÓVIL) -->
  <nav class="navigation-bar">
    <div class="logo-container">
      <img src="/logo.png" alt="El agricultor" class="logo-desktop" />
    </div>

    <div class="nav-links">
      <RouterLink to="/" class="nav-item">
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
          <Icon icon="ph:user-gear-bold" class="nav-icon" />
        </div>
        <span class="label">Técnicos</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

const isHidden = ref(false)
let lastScrollPosition = 0

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

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* --- CONFIGURACIÓN BASE (DESKTOP SIDEBAR) --- */
.navigation-bar {
  --nav-width: 80px;
  --primary: #388E3C;
  --primary-light: #E8F5E9;
  
  display: flex;
  flex-direction: column;
  width: var(--nav-width);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #ffffff;
  border-right: 1px solid #F1F5F9;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.02);
  z-index: 1000;
  padding: 1.5rem 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2.5rem;
}

.logo-desktop {
  width: 44px;
  height: auto;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0 0.5rem;
  box-sizing: border-box;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #94A3B8;
  width: 100%;
  height: 64px;
  border-radius: 14px;
  transition: all 0.2s ease;
  position: relative;
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.nav-icon {
  font-size: 24px;
  transition: transform 0.2s ease;
}

/* Tooltip lateral en Desktop */
.label {
  position: absolute;
  left: 85px;
  background: #1E293B;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.nav-item:hover .label {
  opacity: 1;
  transform: translateX(0);
}

.nav-item:hover {
  color: var(--primary);
}

.nav-item:hover .icon-box {
  background: var(--primary-light);
}

.nav-item:hover .nav-icon {
  transform: scale(1.05);
}

/* Estado Activo */
.router-link-active {
  color: var(--primary);
}

.router-link-active .icon-box {
  background: var(--primary-light);
  color: var(--primary);
}

.router-link-active .nav-icon {
  color: var(--primary);
}

/* --- HEADER MÓVIL --- */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid #F1F5F9;
  z-index: 1100;
  transition: transform 0.3s ease-in-out;
}

.mobile-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 1.25rem;
  height: 100%;
}

.logo-mobile {
  width: 32px;
  height: auto;
}

.brand-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.01em;
}

.header-hidden {
  transform: translateY(-100%);
}

/* --- MEDIA QUERIES PARA MÓVIL (BOTTOM BAR) --- */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }

  .navigation-bar {
    flex-direction: row;
    width: 100%;
    height: 54px;
    top: auto;
    bottom: 0;
    left: 0;
    padding: 0 0.5rem;
    justify-content: space-around;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-right: none;
    border-top: 1px solid #F1F5F9;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  }

  .logo-container {
    display: none;
  }

  .nav-links {
    flex-direction: row;
    justify-content: space-around;
    gap: 0;
    padding: 0;
  }

  .nav-item {
    width: auto;
    height: 100%;
    border-radius: 0;
    flex: 1;
    gap: 2px;
  }

  .icon-box {
    width: 36px;
    height: 28px;
    border-radius: 99px;
    background: transparent !important;
  }

  .nav-icon {
    font-size: 22px;
  }

  /* Etiquetas visibles debajo del icono en móvil */
  .label {
    position: static;
    opacity: 1;
    transform: none;
    background: none;
    color: #94A3B8;
    font-size: 10px;
    font-weight: 600;
    padding: 0;
    box-shadow: none;
    transition: color 0.2s ease;
  }

  .router-link-active .label {
    color: var(--primary);
    font-weight: 700;
  }

  .router-link-active .icon-box {
    background: transparent;
  }
}
</style>