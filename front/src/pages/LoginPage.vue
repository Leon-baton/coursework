<template>
    <div class="login-page">
        <h2>Логин</h2>
        <form @submit.prevent="login">
            <div>
                <label for="login-input">Логин/почта:</label>
                <input type="text" id="login-input" v-model="credentials.login" required />
            </div>
            <div>
                <label for="password-input">Пароль:</label>
                <input type="password" id="password-input" v-model="credentials.password" required />
            </div>
            <button type="submit" :disabled="isLoading">Войти</button>
            <p v-if="error" class="error-message">{{ error }}</p>
        </form>
        <p>Нет аккаунта? <router-link to="/register">Зарегестрироваться</router-link></p>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const credentials = ref({
    login: '',
    password: '',
});
const error = ref('');
const isLoading = ref(false);

const login = async () => {
    error.value = '';
    isLoading.value = true;
    try {
        await authStore.login(credentials.value.login, credentials.value.password);
        router.push('/dashboard');
    } catch (err) {
        error.value = err.message || 'Login failed. Please check your credentials.';
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.login-page {
    max-width: 400px;
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    background-color: #fff;
}

.login-page h2 {
    text-align: center;
    margin-bottom: 25px;
    color: #333;
}

.login-page form div {
    margin-bottom: 15px;
}

.login-page label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-size: 0.95em;
}

.login-page input {
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: calc(100% - 24px);
    box-sizing: border-box;
}

.login-page button {
    width: 100%;
    padding: 12px;
    background-color: #434d57;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
}

.login-page button:hover {
    background-color: #5e656c;
}

.login-page button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.login-page .error-message {
    color: #dc3545;
    text-align: center;
    margin-top: 15px;
    font-size: 0.9em;
}

.login-page p {
    text-align: center;
    margin-top: 20px;
    color: #666;
}

.login-page p a {
    color: #434d57;
    text-decoration: none;
}

.login-page p a:hover {
    color: #434d57;
    text-decoration: underline;
}
</style>
