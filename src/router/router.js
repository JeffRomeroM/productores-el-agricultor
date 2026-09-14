import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase/supabase.js'

import Login from '../views/Login.vue';
import Registro from '../views/Registro.vue';
import Dashboard from '../views/Dashboard.vue';
import Tecnicos from '../views/Tecnicos.vue';
import Productores from '../views/Productores.vue';
import Cultivos from '../views/Cultivos.vue';

const routes = [ 
  { path: '/', name: 'Login', component: Login },
  { 
    path: '/productores', 
    name: 'Productores', 
    component: Productores, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: Dashboard, 
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/tecnicos', 
    name: 'Tecnicos', 
    component: Tecnicos, 
    meta: { requiresAuth: true, requiresAdmin: true } 
  },
  { 
    path: '/nuevo-tecnico', 
    name: 'Registro', 
    component: Registro, 
    meta: { requiresAuth: true, requiresAdmin: true } 
  },
  { 
    path: '/cultivos', 
    name: 'Cultivos', 
    component: Cultivos, 
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/:pathMatch(.*)*', 
    redirect: '/' 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const usuarioId = localStorage.getItem('vagrop_user_id')
  // Normalizamos el rol a minúsculas para evitar problemas con 'Admin' o 'ADMIN'
  const rol = (localStorage.getItem('vagrop_rol') || '').toLowerCase().trim()
  const isAuthenticated = !!usuarioId

  // 1. Si la ruta requiere autenticación y NO está autenticado -> Al Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' })
  }

  // 2. Validación estricta en Supabase: EXCLUSIVAMENTE para técnicos (los admin no se tocan aquí)
  if (isAuthenticated && rol === 'tecnico') {
    const { data: tecnico, error } = await supabase
      .from('tecnicos')
      .select('activo')
      .eq('id', Number(usuarioId))
      .single()

    if (error || (tecnico && tecnico.activo === false)) {
      localStorage.removeItem('vagrop_user_id')
      localStorage.removeItem('vagrop_nombre')
      localStorage.removeItem('vagrop_rol')
      localStorage.removeItem('vagrop_sucursal')
      
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.error('Error al cerrar sesión:', e)
      }

      alert('Tu cuenta ha sido desactivada por el administrador.')
      return next({ name: 'Login' })
    }
  }

  // 3. Validar rutas exclusivas de Administrador
  if (to.meta.requiresAdmin && rol !== 'admin') {
    alert('Acceso denegado: Se requieren permisos de administrador.')
    return next({ name: 'Productores' })
  }

  // 4. Si ya tiene sesión e intenta entrar al Login o Registro -> Redirigir según su rol
  if ((to.path === '/' || to.path === '/registro') && isAuthenticated) {
    return next({ name: rol === 'admin' ? 'Productores' : 'Productores' })
  }

  return next()
})

export default router;