import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({plugins:[react()],css:{postcss:{plugins:[tailwindcss()]}},resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},server:{host:'127.0.0.1',port:5173},build:{chunkSizeWarningLimit:650}});
