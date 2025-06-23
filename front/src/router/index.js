import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'Login', component: () => import('../pages/LoginPage.vue') },
    { path: '/register', name: 'Register', component: () => import('../pages/RegisterPage.vue') },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../pages/DashboardPage.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/document/:id',
        name: 'DocumentEditor',
        component: () => import('../pages/DocumentEditorPage.vue'),
        props: true,
        meta: { requiresAuth: true },
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router;
