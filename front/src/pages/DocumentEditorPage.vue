<template>
    <div class="document-editor-page">
        <div class="editor-header">
            <h2>Название документа: {{ documentTitle }}</h2>

            <div>
                <button @click="saveDocument" :disabled="isSaving || !isContentDirty || isSomeoneSaving">
                    {{ isSaving ? 'Сохранение...' : isSomeoneSaving ? 'Сохранение для всех...' : 'Сохранить документ' }}
                </button>
            </div>
        </div>

        <!-- <span v-if="lastSaved" class="last-saved-info">Последнее сохранение: {{ formatDateTime(lastSaved) }}</span>
        <br /><br /> -->

        <p v-if="isLoading">Загрузка документа...</p>

        <p v-if="error" class="error-message">{{ error }}</p>

        <textarea
            v-model="documentContent"
            @input="handleContentChange"
            class="document-textarea"
            placeholder="Начните печатать..."
            :disabled="isLoading || error || isSomeoneSaving"
        ></textarea>

        <div
            class="participants-list"
            v-if="socketStore.isAuthenticatedOnSocket && socketStore.participants.length > 0"
        >
            <h4>Текущие участники:</h4>

            <ul>
                <li v-for="participant in socketStore.participants" :key="participant">{{ participant }}</li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import _ from 'lodash';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
import socket from '../services/socket';
import { useSocketStore } from '../stores/socket';

const route = useRoute();
const socketStore = useSocketStore();

const documentId = ref(route.params.id);
const documentTitle = ref('Loading...');
const documentContent = ref('');
const initialDocumentContent = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
const isSomeoneSaving = ref(false);
const error = ref('');
const isContentDirty = ref(false);
const lastSaved = ref(null);

const sendDocumentUpdateDebounced = _.debounce((newContent) => {
    if (socket.connected && socketStore.isAuthenticatedOnSocket) {
        socket.emit('sendDocumentUpdate', {
            documentId: documentId.value,
            content: newContent,
        });

        console.log('Sent real-time document update via socket');
    } else {
        console.warn('Socket not connected or authenticated, cannot send real-time update.');
    }
}, 300);

const fetchDocument = async () => {
    isLoading.value = true;

    error.value = '';

    try {
        const response = await api.get(`/documents/${documentId.value}`);

        documentTitle.value = response.data.title;
        documentContent.value = response.data.content || '';
        initialDocumentContent.value = response.data.content || '';
        lastSaved.value = response.data.updatedAt || response.data.createdAt;
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to fetch document.';
        console.error('Failed to fetch document:', err);
    } finally {
        isLoading.value = false;
    }
};

const saveDocument = async () => {
    isSaving.value = true;
    error.value = '';
    try {
        await api.patch(`/documents/${documentId.value}`, {
            content: documentContent.value,
        });
        initialDocumentContent.value = documentContent.value;
        isContentDirty.value = false;
        console.log('Document saved to database.');
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to save document.';
        console.error('Failed to save document:', err);
    } finally {
        isSaving.value = false;
    }
};

const handleContentChange = () => {
    isContentDirty.value = documentContent.value !== initialDocumentContent.value;
    sendDocumentUpdateDebounced(documentContent.value);
};

const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString();
};

onMounted(async () => {
    await fetchDocument();

    socketStore.connect();

    const unsubscribeAuthenticated = socket.on('authenticated', () => {
        console.log('Socket authenticated, joining document room.');

        socket.emit('joinDocument', { documentId: documentId.value });
    });

    if (socketStore.isAuthenticatedOnSocket) {
        socket.emit('joinDocument', { documentId: documentId.value });
    }

    const unsubscribeDocumentUpdate = socket.on('documentUpdate', (data) => {
        if (data.documentId === documentId.value && data.content !== documentContent.value) {
            documentContent.value = data.content;

            console.log('Received real-time document update.');
        }
    });

    const unsubscribeDocumentContent = socket.on('documentContent', (data) => {
        if (data.documentId === documentId.value) {
            documentContent.value = data.content || '';
            initialDocumentContent.value = data.content || '';
            lastSaved.value = data.lastSaved;
            isSomeoneSaving.value = data.isSaving;
            console.log('Received initial document content from socket after joining.');
        }
    });

    const unsubscribeDocumentSavingState = socket.on('documentSavingState', (data) => {
        if (data.documentId === documentId.value) {
            isSomeoneSaving.value = data.isSaving;

            if (!data.isSaving && data.lastSaved) {
                lastSaved.value = data.lastSaved;
            }

            console.log(`Document ${data.documentId} saving state changed to: ${data.isSaving}`);
        }
    });

    watch(documentContent, (newValue) => {
        isContentDirty.value = newValue !== initialDocumentContent.value;
    });

    onUnmounted(() => {
        if (socket.connected) {
            socket.emit('leaveDocument', { documentId: documentId.value });
            console.log('Left document room:', documentId.value);
        }

        unsubscribeAuthenticated();
        unsubscribeDocumentUpdate();
        unsubscribeDocumentContent();
        unsubscribeDocumentSavingState();
    });
});
</script>

<style scoped>
.document-editor-page {
    padding: 20px;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.editor-header h2 {
    margin: 0;
    color: #333;
}

.editor-header button {
    background-color: #28a745;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
}

.editor-header button:hover:not(:disabled) {
    background-color: #218838;
}

.editor-header button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.document-textarea {
    width: 100%;
    min-height: 500px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1.1em;
    line-height: 1.6;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
    resize: vertical;
    font-family: 'Courier New', Courier, monospace; /* Monospace for code-like editing */
}

.document-textarea:focus {
    outline: none;
    border-color: #434d57;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.error-message {
    color: #dc3545;
    margin-top: 10px;
}

.participants-list {
    margin-top: 30px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.participants-list h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #555;
}

.participants-list ul {
    list-style: inside;
    padding: 0;
    margin: 0;
}

.participants-list li {
    padding: 5px 0;
    color: #666;
}
</style>
