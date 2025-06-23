/// <reference types="vitest" />

import vue from '@vitejs/plugin-vue';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            src: fileURLToPath(new URL('src', import.meta.url)),
        },
    },
    plugins: [vue()],
});
