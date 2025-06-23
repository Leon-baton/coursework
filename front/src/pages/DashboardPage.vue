<template>
    <div class="dashboard-page">
        <h2>Здравствуйте, {{ authStore.user?.username || 'User' }}!</h2>

        <h3>Создать новый документ:</h3>

        <form @submit.prevent="createNewDocument" class="new-document-form">
            <input type="text" v-model="newDocumentTitle" placeholder="Заголовок документа" required />
            <button type="submit">Создать документ</button>
        </form>

        <h3>Ваши документы:</h3>

        <p v-if="documents.length === 0 && !isLoading">Сейчас у вас нет документов, но вы можете их создать</p>
        <p v-if="isLoading">Загрузка документов...</p>
        <p v-if="error" class="error-message">{{ error }}</p>

        <ul class="document-list">
            <li v-for="document in documents" :key="document.id" class="document-item">
                <span>{{ document.title }}</span>
                <div class="document-actions">
                    <button @click="openDocument(document.id)">Открыть</button>
                    <button class="delete-button" @click="deleteDocument(document.id)">Удалить</button>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const documents = ref([]);
const newDocumentTitle = ref('');
const isLoading = ref(false);
const error = ref('');

const fetchDocuments = async () => {
    isLoading.value = true;
    error.value = '';
    try {
        const response = await api.get('/documents');
        documents.value = response.data;
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to fetch documents.';
        console.error('Failed to fetch documents:', err);
    } finally {
        isLoading.value = false;
    }
};

const createNewDocument = async () => {
    error.value = '';
    if (!newDocumentTitle.value.trim()) {
        error.value = 'Document title cannot be empty.';
        return;
    }
    try {
        const response = await api.post('/documents', { title: newDocumentTitle.value });
        documents.value.push(response.data);
        newDocumentTitle.value = '';
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to create document.';
        console.error('Failed to create document:', err);
    }
};

const openDocument = (id) => {
    router.push(`/document/${id}`);
};

const deleteDocument = async (id) => {
    error.value = '';
    if (confirm('Are you sure you want to delete this document?')) {
        try {
            await api.delete(`/documents/${id}`);
            documents.value = documents.value.filter((doc) => doc.id !== id);
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete document.';
            console.error('Failed to delete document:', err);
        }
    }
};

onMounted(() => {
    fetchDocuments();
});
</script>

<style scoped>
.dashboard-page {
    padding: 20px;
}

.dashboard-page h2 {
    margin-bottom: 40px;
    color: #333;
}

.dashboard-page h3 {
    margin-top: 30px;
    margin-bottom: 15px;
    color: #444;
}

.new-document-form {
    display: flex;
    gap: 10px;
    margin-bottom: 40px;
}

.new-document-form input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.new-document-form button {
    padding: 10px 15px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.new-document-form button:hover {
    background-color: #218838;
}

.document-list {
    list-style: none;
    padding: 0;
}

.document-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
}

.document-item:last-child {
    border-bottom: none;
}

.document-item span {
    font-size: 1.1em;
    color: #333;
}

.document-actions button {
    padding: 8px 12px;
    margin-left: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    transition: background-color 0.3s ease;
}

.document-actions button:first-of-type {
    background-color: #434d57;
    color: white;
}

.document-actions button:first-of-type:hover {
    background-color: #5e656c;
}

.document-actions .delete-button {
    background-color: #dc3545;
    color: white;
}

.document-actions .delete-button:hover {
    background-color: #c82333;
}

.error-message {
    color: #dc3545;
    margin-top: 10px;
}
</style>
