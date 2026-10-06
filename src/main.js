import { createApp } from 'vue';

const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = configuredApiBase
    ? (configuredApiBase.endsWith('/api') ? configuredApiBase : `${configuredApiBase}/api`)
    : '/api';

createApp({
    data() {
        return {
            accessToken: localStorage.getItem('access_token') || '',
            refreshToken: localStorage.getItem('refresh_token') || '',
            user: null,
            products: [],
            credentials: { username: '', email: '', identity: '', password: '' },
            draft: { product_name: '', description: '', price: '', quantity: '' },
            registering: false,
            formOpen: false,
            editingId: null,
            loading: false,
            busy: false,
            error: '',
            notice: ''
        };
    },
    async mounted() {
        if (this.accessToken) await this.loadUser();
    },
    methods: {
        async request(path, options = {}, retry = true) {
            const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
            if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

            const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
            const result = await response.json().catch(() => ({}));

            if (response.status === 401 && retry && this.refreshToken && path !== '/auth/refresh') {
                const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: this.refreshToken })
                });
                const refreshResult = await refreshed.json().catch(() => ({}));
                if (refreshed.ok && refreshResult.tokens) {
                    this.storeTokens(refreshResult.tokens);
                    return this.request(path, options, false);
                }
                this.clearSession();
            }

            if (!response.ok) throw new Error(result.error || 'The API request failed.');
            return result;
        },
        storeTokens(tokens) {
            this.accessToken = tokens.access_token;
            this.refreshToken = tokens.refresh_token;
            localStorage.setItem('access_token', this.accessToken);
            localStorage.setItem('refresh_token', this.refreshToken);
        },
        clearSession() {
            this.accessToken = '';
            this.refreshToken = '';
            this.user = null;
            this.products = [];
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        },
        async authenticate() {
            this.error = '';
            this.notice = '';
            this.busy = true;
            try {
                let result;
                if (this.registering) {
                    result = await this.request('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({
                            username: this.credentials.username,
                            email: this.credentials.email,
                            password: this.credentials.password
                        })
                    }, false);
                } else {
                    result = await this.request('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({
                            identity: this.credentials.identity,
                            password: this.credentials.password
                        })
                    }, false);
                }
                this.storeTokens(result.tokens);
                this.user = result.user;
                this.credentials.password = '';
                await this.loadProducts();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        toggleRegistration() {
            this.registering = !this.registering;
            this.error = '';
            this.notice = '';
        },
        async loadUser() {
            try {
                const result = await this.request('/auth/me');
                this.user = result.user;
                await this.loadProducts();
            } catch (error) {
                this.error = error.message;
                this.clearSession();
            }
        },
        async loadProducts() {
            this.loading = true;
            this.error = '';
            try {
                const result = await this.request('/products');
                this.products = result.data;
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },
        openCreate() {
            this.editingId = null;
            this.draft = { product_name: '', description: '', price: '', quantity: '' };
            this.formOpen = true;
            this.error = '';
        },
        openEdit(product) {
            this.editingId = product.id;
            this.draft = {
                product_name: product.product_name,
                description: product.description || '',
                price: product.price,
                quantity: product.quantity
            };
            this.formOpen = true;
            this.error = '';
        },
        closeForm() {
            this.formOpen = false;
            this.editingId = null;
        },
        async saveProduct() {
            this.busy = true;
            this.error = '';
            this.notice = '';
            try {
                const editing = this.editingId !== null;
                await this.request(editing ? `/products/${this.editingId}` : '/products', {
                    method: editing ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        ...this.draft,
                        price: Number(this.draft.price),
                        quantity: Number(this.draft.quantity)
                    })
                });
                this.closeForm();
                this.notice = editing ? 'Product updated.' : 'Product added.';
                await this.loadProducts();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async deleteProduct(product) {
            if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return;
            this.busy = true;
            this.error = '';
            this.notice = '';
            try {
                await this.request(`/products/${product.id}`, { method: 'DELETE' });
                this.notice = 'Product deleted.';
                await this.loadProducts();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
        async logout() {
            try {
                if (this.accessToken) {
                    await this.request('/auth/logout', {
                        method: 'POST',
                        body: JSON.stringify({ refresh_token: this.refreshToken })
                    }, false);
                }
            } catch (error) {
                this.error = error.message;
            } finally {
                this.clearSession();
            }
        }
    }
}).mount('#app');
