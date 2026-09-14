<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>Agroservicio El Agricultor</h2>
        <p>Inicia sesión</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            v-model="email" 
            required 
            placeholder="tecnico@correo.com"
          />
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <div class="password-wrapper">
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
            >
              <Icon :icon="mostrarPassword ? 'ph:eye-closed-bold' : 'ph:eye-bold'" class="eye-icon" />
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="error-alert">
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn-submit" :disabled="cargando">
          <span v-if="cargando">Verificando acceso...</span>
          <span v-else>Iniciar sesión</span>
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

// Al cargar, recuperamos el último email usado para mayor comodidad
onMounted(() => {
  const ultimoEmail = localStorage.getItem('vagrop_ultimo_email')
  if (ultimoEmail) {
    email.value = ultimoEmail
  }
})

// Traductor de errores técnicos a mensajes amigables
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
    // 1. Intentar autenticación estándar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    // SI HAY ERROR DE RED / OFFLINE PERO YA EXISTEN DATOS CACHEADOS DEL MISMO USUARIO
    if (authError) {
      const usuarioCacheado = localStorage.getItem('vagrop_user_id')
      const emailCacheado = localStorage.getItem('vagrop_ultimo_email')

      // Si no hay red pero coincide el correo y tenemos sesión guardada previamente, permitimos acceso offline
      if (!navigator.onLine && emailCacheado === email.value && usuarioCacheado) {
        console.warn('Modo offline detectado: Usando credenciales en caché.')
        router.push('/productores')
        return
      }

      throw authError
    }

    if (authData.user) {
      // 2. Intentar consultar la tabla tecnicos
      const { data: tecnicoData, error: dbError } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('correo', email.value)
        .single()

      if (dbError) {
        // Si falla la consulta a la BD por falta de señal, pero Supabase Auth dejó pasar al usuario
        // y ya tenemos sus datos en localStorage, lo dejamos pasar de forma resiliente.
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

      // 3. Guardar datos clave y el correo actual en localStorage para uso offline futuro
      localStorage.setItem('vagrop_user_id', tecnicoData.id)
      localStorage.setItem('vagrop_nombre', tecnicoData.nombre)
      localStorage.setItem('vagrop_rol', tecnicoData.rol || 'tecnico')
      localStorage.setItem('vagrop_sucursal', tecnicoData.sucursal || 'TODAS')
      localStorage.setItem('vagrop_ultimo_email', email.value)

      // 4. Redirigir al panel principal
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
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #F8FAFC;
  padding: 1rem;
}

.login-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 1.75rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-header h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 0.25rem 0;
}

.login-header p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-group input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  font-size: 0.85rem;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #388E3C;
  box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.15);
}

/* Contenedor relativo para el campo de contraseña y el botón del ojito */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 2.5rem; /* Espacio para que el texto no choque con el ícono */
}

.btn-toggle-password {
  position: absolute;
  right: 0.5rem;
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
  color: #388E3C;
}

.eye-icon {
  font-size: 1.15rem;
}

.error-alert {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  color: #DC2626;
  font-size: 0.75rem;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
}

.btn-submit {
  width: 100%;
  background: #388E3C;
  color: white;
  border: none;
  padding: 0.7rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: #2E7D32;
}

.btn-submit:disabled {
  background: #94A3B8;
  cursor: not-allowed;
}
</style>