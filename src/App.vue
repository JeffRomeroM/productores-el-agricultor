<script setup>
import Menu from './components/Menu.vue';
</script>

<template>
  <div class="app">
    <!-- Menú fijo lateral o inferior -->
    <Menu />

    <!-- Contenido principal -->
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ELIMINA height: 100% de aquí, solo deja width */
body, html, #app {
  width: 100%;
  min-height: 100vh; /* Usa min-height en lugar de height */
}

body {
  background-color: white;
  color: black;
  transition: background-color 0.3s, color 0.3s;
  overflow-x: hidden; /* Evita scroll horizontal innecesario */
}

.app {
  display: flex;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding: 1rem;
  /* El margen izquierdo debe coincidir con el ancho fijo que pusimos al Menu (75px) */
  margin-left: 75px; 
  width: 100%;
}

@media (max-width: 640px) {
  .app {
    display: block; /* Cambia flex por block en móvil para evitar conflictos */
  }

  .content {
    margin-left: 0;
    margin-bottom: 70px; /* Espacio para que el menú inferior no tape el contenido */
    padding-top: 60px; /* ESPACIO PARA EL LOGO FLOTANTE */
  }
}
</style>
