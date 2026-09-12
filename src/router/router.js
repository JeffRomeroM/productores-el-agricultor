import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue';
import Tecnicos from '../views/Tecnicos.vue';
import Productores from '../views/Productores.vue';
import Cultivos from '../views/Cultivos.vue';



    const routes = [ 
  { path: '/', name: 'productores', component: Productores },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/tecnicos', name: 'Tecnicos', component: Tecnicos },
  { path: '/cultivos', name: 'Cultivos', component: Cultivos },
  // otras rutas
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router;
