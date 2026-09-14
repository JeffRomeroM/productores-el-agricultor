<template>
  <div class="app-wrapper">
    <div class="registro-card">
      <div class="registro-header">
        <div class="header-icon-wrapper">
          <Icon icon="ph:user-plus-bold" class="header-icon" />
        </div>
        <h2>Nuevo Usuario</h2>
        <p>Registrar técnico o administrador en el sistema</p>
      </div>

      <form @submit.prevent="handleRegistro" class="registro-form">
        <div class="form-group">
          <label>Nombre Completo</label>
          <div class="input-with-icon">
            <Icon icon="ph:user-bold" class="field-icon" />
            <input 
              type="text" 
              v-model="nombre" 
              required 
              placeholder="Ej. Juan Pérez"
            />
          </div>
        </div>

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
          <label>Teléfono</label>
          <div class="input-with-icon">
            <Icon icon="ph:phone-bold" class="field-icon" />
            <input 
              type="tel" 
              v-model="telefono" 
              placeholder="88888888"
            />
          </div>
        </div>

        <!-- Sucursales con botón independiente para "Ambas" -->
        <div class="form-group">
          <label>Sucursal Asignada</label>
          <div class="sucursales-grid-3">
            <label :class="['selection-card', { active: sucursal === 'Nueva Guinea' }]">
              <input type="radio" value="Nueva Guinea" v-model="sucursal" class="sr-only" />
              <Icon icon="ph:storefront-bold" class="card-icon" />
              <span>Nueva Guinea</span>
            </label>

            <label :class="['selection-card', { active: sucursal === 'Rama' }]">
              <input type="radio" value="Rama" v-model="sucursal" class="sr-only" />
              <Icon icon="ph:storefront-bold" class="card-icon" />
              <span>Rama</span>
            </label>

            <label :class="['selection-card full-width', { active: sucursal === 'Ambas' }]">
              <input type="radio" value="Ambas" v-model="sucursal" class="sr-only" />
              <Icon icon="ph:buildings-bold" class="card-icon" />
              <span>Ambas Sucursales</span>
            </label>
          </div>
        </div>

        <!-- Rol de Usuario con diseño moderno -->
        <div class="form-group">
          <label>Rol de Usuario</label>
          <div class="selection-grid">
            <label :class="['selection-card', { active: rol === 'tecnico' }]">
              <input type="radio" value="tecnico" v-model="rol" class="sr-only" />
              <Icon icon="ph:plant-bold" class="card-icon" />
              <span>Técnico de Campo</span>
            </label>

            <label :class="['selection-card', { active: rol === 'admin' }]">
              <input type="radio" value="admin" v-model="rol" class="sr-only" />
              <Icon icon="ph:shield-check-bold" class="card-icon" />
              <span>Administrador</span>
            </label>
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
              placeholder="Mínimo 6 caracteres"
            />
            <button 
              type="button" 
              class="btn-toggle-password" 
              @click="mostrarPassword = !mostrarPassword"
              tabindex="-1"
            >
              <Icon :icon="mostrarPassword ? 'ph:eye-slash-bold' : 'ph:eye-bold'" />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Confirmar Contraseña</label>
          <div class="input-with-icon password-wrapper">
            <Icon icon="ph:lock-key-bold" class="field-icon" />
            <input 
              :type="mostrarConfirmPassword ? 'text' : 'password'" 
              v-model="confirmPassword" 
              required 
              placeholder="Repite la contraseña"
            />
            <button 
              type="button" 
              class="btn-toggle-password" 
              @click="mostrarConfirmPassword = !mostrarConfirmPassword"
              tabindex="-1"
            >
              <Icon :icon="mostrarConfirmPassword ? 'ph:eye-slash-bold' : 'ph:eye-bold'" />
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="error-alert">
          <Icon icon="ph:warning-circle-bold" />
          <span>{{ errorMsg }}</span>
        </div>

        <div v-if="successMsg" class="success-alert">
          <Icon icon="ph:check-circle-bold" />
          <span>{{ successMsg }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="cargando">
          <Icon v-if="!cargando" icon="ph:user-plus-bold" />
          <Icon v-else icon="ph:spinner-gap-bold" class="spinner" />
          <span>{{ cargando ? 'Registrando...' : 'Crear Cuenta' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

const nombre = ref('')
const email = ref('')
const telefono = ref('')
const password = ref('')
const confirmPassword = ref('')
const sucursal = ref('Nueva Guinea')
const rol = ref('tecnico')

const mostrarPassword = ref(false)
const mostrarConfirmPassword = ref(false)

const cargando = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const obtenerMensajeErrorAmigable = (err) => {
  if (!navigator.onLine) {
    return 'No hay conexión a internet. Verifique su red e intente nuevamente.'
  }

  const mensaje = err.message || ''
  
  if (mensaje.includes('Password should be at least 6 characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (mensaje.includes('User already registered') || mensaje.includes('already registered')) {
    return 'Este correo electrónico ya está registrado en el sistema.'
  }
  if (mensaje.includes('Invalid email') || mensaje.includes('unable to validate email')) {
    return 'El formato del correo electrónico no es válido.'
  }
  if (mensaje.includes('violates row-level security')) {
    return 'No tienes permisos suficientes para registrar usuarios en la base de datos.'
  }
  if (mensaje.includes('violates check constraint') && mensaje.includes('sucursal')) {
    return 'La sucursal seleccionada no es válida en la base de datos.'
  }
  
  return mensaje || 'Ocurrió un error inesperado al procesar el registro.'
}

const handleRegistro = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden. Por favor verifícalas.'
    return
  }

  cargando.value = true

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })

    if (authError) throw authError

    if (authData.user) {
      const { error: dbError } = await supabase
        .from('tecnicos')
        .insert([
          {
            nombre: nombre.value,
            correo: email.value,
            telefono: telefono.value,
            sucursal: sucursal.value,
            rol: rol.value,
            activo: true
          }
        ])

      if (dbError) throw dbError

      successMsg.value = '¡Usuario registrado con éxito!'
      
      nombre.value = ''
      email.value = ''
      telefono.value = ''
      password.value = ''
      confirmPassword.value = ''
      sucursal.value = 'Nueva Guinea'
      rol.value = 'tecnico'
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
  top: 10vh;
  left: 0;
  width: 100vw;
  min-height: calc(100vh - 10vh);
  padding: 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0F172A;
  background-color: #F8FAFC;
  box-sizing: border-box;
  
  /* Centrado infalible ignorando el contenedor padre */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-x: hidden;
}

.registro-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 1.5rem 1.25rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  box-sizing: border-box;
  margin-bottom: 5rem;
}

@media (min-width: 640px) {
  .registro-card {
    padding: 2rem;
  }
}

.registro-header {
  text-align: center;
  margin-bottom: 1.25rem;
}

.header-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: #E8F5E9;
  color: #388E3C;
  border-radius: 12px;
  margin-bottom: 0.5rem;
}

.header-icon {
  font-size: 1.35rem;
}

.registro-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 0.2rem 0;
}

.registro-header p {
  font-size: 0.78rem;
  color: #64748B;
  margin: 0;
}

.form-group {
  margin-bottom: 0.85rem;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.3rem;
}

/* Grillas de selección */
.selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.sucursales-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.sucursales-grid-3 .full-width {
  grid-column: span 2;
}

.selection-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.7rem 0.5rem;
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 500;
  color: #334155;
  user-select: none;
  text-align: center;
}

.selection-card:hover {
  border-color: #94A3B8;
  background: #F1F5F9;
}

.selection-card.active {
  background: #E8F5E9;
  border-color: #388E3C;
  color: #2E7D32;
  font-weight: 600;
}

.card-icon {
  font-size: 1.1rem;
  color: #64748B;
  flex-shrink: 0;
}

.selection-card.active .card-icon {
  color: #388E3C;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 0.85rem;
  color: #94A3B8;
  font-size: 1rem;
  pointer-events: none;
}

.form-group input {
  width: 100%;
  padding: 0.7rem 0.75rem 0.7rem 2.5rem;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
  background: white;
  color: #0F172A;
  transition: all 0.2s ease;
  -webkit-appearance: none;
}

.form-group input:focus {
  border-color: #388E3C;
  box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.12);
}

.password-wrapper input {
  padding-right: 2.75rem;
}

.btn-toggle-password {
  position: absolute;
  right: 0.5rem;
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  padding: 0.5rem;
}

.btn-toggle-password:hover {
  color: #334155;
}

.error-alert,
.success-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  margin-bottom: 0.85rem;
  font-weight: 600;
}

.error-alert {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  color: #DC2626;
}

.success-alert {
  background: #E8F5E9;
  border: 1px solid #A7F3D0;
  color: #388E3C;
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  background: #388E3C;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(56, 142, 60, 0.2);
}

.btn-submit:hover {
  background: #2E7D32;
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