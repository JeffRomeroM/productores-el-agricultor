<template>
  <div class="app-wrapper">
    <!-- Patrón de iconos de Iconify opacos en el fondo -->
    <div class="agro-pattern-bg">
      <div v-for="n in 36" :key="n" class="pattern-icon-wrapper">
        <Icon :icon="iconosFondo[n % iconosFondo.length]" />
      </div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <div class="header-icon-wrapper">
          <Icon icon="ph:shield-check-bold" class="header-icon" />
        </div>
        <h2>Agroservicio El Agricultor</h2>
        <p>Inicia sesión en el sistema</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Correo Electrónico</label>
          <div class="input-with-icon">
            <Icon icon="ph:envelope-bold" class="field-icon" />
            <input 
              type="email" 
              v-model="email" 
              required 
              placeholder="tecnico@correo.com"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <div class="input-with-icon password-wrapper">
            <Icon icon="ph:lock-key-bold" class="field-icon" />
            <input 
              :type="mostrarPassword ? 'text' : 'password'" 
              v-model="password" 
              required 
              placeholder="••••••••"
            />
            <button 
              type="button" 
              class="btn-toggle-password" 
              @click="mostrarPassword = !mostrarPassword"
              :title="mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
              tabindex="-1"
            >
              <Icon :icon="mostrarPassword ? 'ph:eye-slash-bold' : 'ph:eye-bold'" class="eye-icon" />
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="error-alert">
          <Icon icon="ph:warning-circle-bold" />
          <span>{{ errorMsg }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="cargando">
          <Icon v-if="!cargando" icon="ph:sign-in-bold" />
          <Icon v-else icon="ph:spinner-gap-bold" class="spinner" />
          <span>{{ cargando ? 'Verificando acceso...' : 'Iniciar sesión' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const mostrarPassword = ref(false)
const cargando = ref(false)
const errorMsg = ref('')

// Lista de iconos de Iconify temáticos para el fondo
const iconosFondo = [
  'ph:plant-bold',
  'ph:grains-bold',
  'mdi:seed',
  'ph:tree-bold',
  'ph:drop-bold'
]

onMounted(() => {
  const ultimoEmail = localStorage.getItem('vagrop_ultimo_email')
  if (ultimoEmail) {
    email.value = ultimoEmail
  }
})

const obtenerMensajeErrorAmigable = (err) => {
  const mensaje = err.message || ''

  if (mensaje.includes('Invalid login credentials') || mensaje.includes('Invalid grant')) {
    return 'El correo o la contraseña son incorrectos. Por favor, verifícalos.'
  }
  if (mensaje.includes('Email not confirmed')) {
    return 'El correo electrónico aún no ha sido confirmado.'
  }
  if (mensaje.includes('Failed to fetch') || mensaje.includes('NetworkError')) {
    return 'Sin conexión a internet. Si ya habías iniciado sesión antes en este dispositivo, intenta de nuevo para acceder en modo offline.'
  }
  if (mensaje.includes('No se pudo verificar el perfil técnico')) {
    return 'No hay conexión con la base de datos para verificar tu perfil. Asegúrate de tener señal o haber ingresado antes.'
  }
  if (mensaje.includes('No se encontró un perfil técnico')) {
    return 'No existe un perfil técnico registrado en el sistema para este correo.'
  }
  if (mensaje.includes('Esta cuenta se encuentra desactivada')) {
    return 'Tu cuenta se encuentra desactivada. Contacta al administrador.'
  }

  return mensaje || 'Ocurrió un error inesperado al intentar iniciar sesión.'
}

const handleLogin = async () => {
  cargando.value = true
  errorMsg.value = ''

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (authError) {
      const usuarioCacheado = localStorage.getItem('vagrop_user_id')
      const emailCacheado = localStorage.getItem('vagrop_ultimo_email')

      if (!navigator.onLine && emailCacheado === email.value && usuarioCacheado) {
        router.push('/productores')
        return
      }
      throw authError
    }

    if (authData.user) {
      const { data: tecnicoData, error: dbError } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('correo', email.value)
        .single()

      if (dbError) {
        const usuarioCacheado = localStorage.getItem('vagrop_user_id')
        if (!navigator.onLine && usuarioCacheado) {
          router.push('/productores')
          return
        }
        throw new Error('No se pudo verificar el perfil técnico (Sin conexión a la base de datos).')
      }

      if (!tecnicoData) {
        throw new Error('No se encontró un perfil técnico registrado para este correo.')
      }

      if (tecnicoData.activo === false) {
        throw new Error('Esta cuenta se encuentra desactivada. Contacte al administrador.')
      }

      localStorage.setItem('vagrop_user_id', tecnicoData.id)
      localStorage.setItem('vagrop_nombre', tecnicoData.nombre)
      localStorage.setItem('vagrop_rol', tecnicoData.rol || 'tecnico')
      localStorage.setItem('vagrop_sucursal', tecnicoData.sucursal || 'TODAS')
      localStorage.setItem('vagrop_ultimo_email', email.value)

      router.push('/productores')
    }
  } catch (err) {
    errorMsg.value = obtenerMensajeErrorAmigable(err)
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.app-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  min-height: 100vh;
  padding: 1.5rem 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0F172A;
  box-sizing: border-box;
  
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  overflow: hidden;
}

/* Contenedor de la cuadrícula de iconos de fondo */
.agro-pattern-bg {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(6, 1fr);
  padding: 1.5rem;
  gap: 1rem;
  align-items: center;
  justify-items: center;
  pointer-events: none;
  z-index: 1;
}

.pattern-icon-wrapper {
  font-size: 2.25rem;
  color: #16a34a;
  opacity: 0.08;
  transform: rotate(calc(var(--n, 1) * 15deg));
}

.login-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid #DCFCE7;
  border-radius: 20px;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(22, 163, 74, 0.08), 0 8px 10px -6px rgba(22, 163, 74, 0.04);
  box-sizing: border-box;
  z-index: 2;
}

@media (min-width: 640px) {
  .login-card {
    padding: 2.5rem 2rem;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.header-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background-color: #DCFCE7;
  color: #16A34A;
  border-radius: 14px;
  margin-bottom: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
}

.login-header h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 0.3rem 0;
}

.login-header p {
  font-size: 0.82rem;
  color: #64748B;
  margin: 0;
}

.form-group {
  margin-bottom: 1.1rem;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.4rem;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 0.9rem;
  color: #94A3B8;
  font-size: 1.1rem;
  pointer-events: none;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 0.85rem 0.75rem 2.75rem;
  border: 1px solid #CBD5E1;
  border-radius: 12px;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
  background: white;
  color: #0F172A;
  transition: all 0.2s ease;
  -webkit-appearance: none;
}

.form-group input:focus {
  border-color: #16A34A;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
}

.password-wrapper input {
  padding-right: 3rem;
}

.btn-toggle-password {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  color: #64748B;
}

.btn-toggle-password:hover {
  color: #16A34A;
}

.eye-icon {
  font-size: 1.25rem;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  color: #DC2626;
  font-size: 0.8rem;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  margin-bottom: 1.2rem;
  font-weight: 600;
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  background: #16A34A;
  color: white;
  border: none;
  padding: 0.85rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);
}

.btn-submit:hover {
  background: #15803D;
}

.btn-submit:disabled {
  background: #94A3B8;
  box-shadow: none;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>