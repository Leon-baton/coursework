<template>
    <div class="register-page">
        <h2>Register</h2>
        <form @submit.prevent="register">
            <div>
                <label for="email">Почта:</label>
                <input type="email" id="email" v-model="userData.email" required />
            </div>
            <div>
                <label for="username">Логин:</label>
                <input type="text" id="username" v-model="userData.username" required />
            </div>
            <div>
                <label for="password">Пароль:</label>
                <input type="password" id="password" v-model="userData.password" required />
            </div>
            <div>
                <label for="firstname">Имя:</label>
                <input type="text" id="firstname" v-model="userData.firstname" required />
            </div>
            <div>
                <label for="lastname">Фамилия:</label>
                <input type="text" id="lastname" v-model="userData.lastname" required />
            </div>
            <button type="submit" :disabled="isLoading">Зарегестрироваться</button>
            <p v-if="error" class="error-message">{{ error }}</p>
            <p v-if="success" class="success-message">{{ success }}</p>
        </form>
        <p>Уже есть аккаунт? <router-link to="/login">Войти</router-link></p>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const userData = ref({
    email: '',
    username: '',
    password: '',
    firstname: '',
    lastname: '',
});
const error = ref('');
const success = ref('');
const isLoading = ref(false);

const register = async () => {
    error.value = '';
    success.value = '';
    isLoading.value = true;
    try {
        await api.post('/auth/register', userData.value);
        success.value = 'Регистрация прошла успешно, редиректим на страницу логина...';
        setTimeout(() => {
            router.push('/login');
        }, 2000);
    } catch (err) {
        error.value = err.response?.data?.message || 'Не получилось зарегестрироваться, попробуйте еще раз попозже.';
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.register-page {
    max-width: 400px;
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    background-color: #fff;
}

.register-page h2 {
    text-align: center;
    margin-bottom: 25px;
    color: #333;
}

.register-page form div {
    margin-bottom: 15px;
}

.register-page label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-size: 0.95em;
}

.register-page input {
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: calc(100% - 24px);
    box-sizing: border-box;
}

.register-page button {
    width: 100%;
    padding: 12px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
}

.register-page button:hover {
    background-color: #218838;
}

.register-page button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.register-page .error-message {
    color: #dc3545;
    text-align: center;
    margin-top: 15px;
    font-size: 0.9em;
}

.register-page .success-message {
    color: #28a745;
    text-align: center;
    margin-top: 15px;
    font-size: 0.9em;
}

.register-page p {
    text-align: center;
    margin-top: 20px;
    color: #666;
}

.register-page p a {
    color: #434d57;
    text-decoration: none;
}

.register-page p a:hover {
    color: #434d57;
    text-decoration: underline;
}
</style>
