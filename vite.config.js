import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    if (command === 'build' && mode === 'production' && !env.VITE_API_BASE_URL?.trim()) {
        throw new Error('Set VITE_API_BASE_URL to the deployed LavaLust backend URL before building.');
    }

    return {
        resolve: {
            alias: {
                vue: 'vue/dist/vue.esm-bundler.js'
            }
        },
        server: {
            proxy: {
                '/api': {
                    target: env.VITE_DEV_API_TARGET?.trim() || 'http://127.0.0.1:3000',
                    changeOrigin: true
                }
            }
        }
    };
});
