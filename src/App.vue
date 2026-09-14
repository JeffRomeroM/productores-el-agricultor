<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Menu from './components/Menu.vue'

const route = useRoute()

const mostrarHeader = computed(() => {
  const rutasPublicas = ['/',  '/registro']
  return !rutasPublicas.includes(route.path)
})

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './supabase/supabase.js'

const router = useRouter()
let canalTecnico = null

onMounted(() => {
  const usuarioId = localStorage.getItem('vagrop_user_id')
  const rol = localStorage.getItem('vagrop_rol')

  if (usuarioId && rol !== 'admin') {
    // Forzamos a número para evitar conflictos de tipo en el filtro
    const idNumerico = Number(usuarioId)

    canalTecnico = supabase
      .channel('seguridad-tecnico-activo')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tecnicos',
          filter: `id=eq.${idNumerico}`
        },
        async (payload) => {
          // Validamos explícitamente si pasó a falso
          if (payload.new && payload.new.activo === false) {
            // Limpieza total del almacenamiento local
            localStorage.removeItem('vagrop_user_id')
            localStorage.removeItem('vagrop_nombre')
            localStorage.removeItem('vagrop_rol')
            localStorage.removeItem('vagrop_sucursal')
            
            try {
              await supabase.auth.signOut()
            } catch (e) {
              console.error('Error al cerrar sesión de auth:', e)
            }
            
            alert('Tu cuenta ha sido desactivada por el administrador.')
            router.push('/login')
          }
        }
      )
      .subscribe((status) => {
        console.log('Estado de suscripción Realtime:', status)
      })
  }
})

onUnmounted(() => {
  if (canalTecnico) {
    supabase.removeChannel(canalTecnico)
  }
})
</script>

<template>

  <router-view />

  <!-- Solo se muestra en móvil cuando no es ruta pública -->
  <Menu v-if="mostrarHeader" class="mobile-only" />
</template>

<style>
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
/* Ocultar menú inferior en PC (pantallas mayores a 768px) */
@media (min-width: 768px) {
  .mobile-only {
    display: none !important;
  }
}

/* Ocultar header de PC en móviles (menores a 767px) */
@media (max-width: 767px) {
  .desktop-only {
    display: none !important;
  }
}
/*CONFIGURACIÓN GLOBAL DE IMPRESIÓN TÉRMICA (80mm / 58mm)*/
@media print {
  /* 1. Oculta únicamente el contenedor principal de la app, dejando libre el body */
  #app {
    display: none !important;
  }

  /* 2. Restablece la capa del modal para que no bloquee ni oscurezca la impresión */
  .modal-overlay {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: auto !important;
    background: transparent !important;
    backdrop-filter: none !important;
    display: block !important;
    z-index: 9999 !important;
  }

  /* 3. Limpia la tarjeta del modal para que no dibuje bordes ni sombras de caja */
  .modal-card.modal-invoice {
    box-shadow: none !important;
    border: none !important;
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Oculta los elementos internos del modal que no sean el ticket (como la X de cerrar o botones) */
  .modal-header,
  .invoice-actions {
    display: none !important;
  }

  /* 4. Muestra exclusivamente el contenido del ticket térmico */
  #printable-invoice, 
  #printable-invoice * {
    display: block !important;
    visibility: visible !important;
  }

  #printable-invoice {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 76mm !important;
    margin: 0 !important;
    padding: 2mm !important;
    background: #fff !important;
    color: #000 !important;
    font-family: 'Courier New', Courier, monospace !important;
    font-size: 11px !important;
  }

  /* Forzar la estructura de tablas y totales del ticket */
  #printable-invoice table,
  #printable-invoice tr,
  #printable-invoice td,
  #printable-invoice th {
    display: table !important;
    width: 100% !important;
  }

  #printable-invoice .invoice-total-section {
    display: flex !important;
    visibility: visible !important;
  }

  @page {
    size: 80mm auto;
    margin: 0;
  }
}
</style>