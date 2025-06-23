<template>
    <div id="app">
        <header>
            <h1>Онлайн редактор</h1>
            <nav v-if="authStore.isAuthenticated">
                <router-link to="/dashboard">Панель</router-link>
                <a href="#" @click.prevent="logout">Выйти</a>
            </nav>
        </header>
        <main class="container">
            <router-view />
        </main>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const logout = () => {
    authStore.logout();
    router.push('/login');
};
</script>

<style scoped></style>
