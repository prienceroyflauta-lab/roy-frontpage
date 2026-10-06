# Bahay Catalog frontend

This is the standalone Vue 3 frontend for the LavaLust product-management API. It keeps the premium dark navy, cyan, and gold theme and eye motif from the combined application. Authentication, product listing, create/update/delete, refresh-token rotation, and logout all use the backend HTTP API; this static site does not connect directly to the database.

## Run locally

Install Node.js 20.19 or newer, then:

```sh
npm ci
npm run dev
```

The Vite development server proxies `/api` to `http://127.0.0.1:3000` by default. Start the LavaLust backend on that address first. To use another local backend, set `VITE_DEV_API_TARGET` in `.env.local`.

## Deploy on Render

Deploy the backend service from the `roy-backyard` repository first. Then create a Render Blueprint from `render.yaml` in this repository and set `VITE_API_BASE_URL` to the backend's public HTTPS origin, without a trailing slash or `/api` (for example, `https://your-backend.onrender.com`). Render builds the Vue app and publishes `dist/` as a static site.

`VITE_API_BASE_URL` is public frontend configuration compiled into browser assets. Do not put database credentials, JWT signing secrets, or other private values in this variable or in frontend environment files.

The backend must allow browser requests from the deployed frontend origin. The current LavaLust API permits cross-origin requests; after Render assigns the frontend URL, set `allow_origin` in `app/config/api.php` in `roy-backyard` to that exact frontend origin and redeploy the backend.

## API endpoints used

- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`
- `GET /api/auth/me`
- `GET /api/products`, `POST /api/products`
- `PUT /api/products/{id}`, `DELETE /api/products/{id}`
