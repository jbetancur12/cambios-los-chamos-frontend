# Frontend - Cambios Los Chamos

Aplicación web (PWA) para la gestión de remesas de Cambios Los Chamos.

## Stack

- React 19 + Vite + TypeScript
- TanStack Query 5 (datos del servidor)
- React Router 7
- Tailwind CSS + Shadcn UI (Radix UI + Lucide)
- React Hook Form + Zod
- Recharts (gráficos) y Sonner (toasts)
- PWA con `vite-plugin-pwa`
- Firebase Cloud Messaging (notificaciones push)
- PostHog (analítica)

## Cliente de API

`src/lib/api.ts` usa `fetch` (no hay axios). Detecta la URL del backend automáticamente: `localhost:3000`
en desarrollo y `/api` (Nginx) en producción. Las respuestas vienen envueltas en `ApiResponse<T>`
(`{ success, data, error }`) y el token se lee de `localStorage['authToken']`.

## Estructura (`src/`)

- `pages/`: páginas por ruta
- `components/`: componentes de UI y formularios (`ui/` = Shadcn)
- `contexts/`: contextos de React (p. ej. `AuthContext`)
- `hooks/`: hooks y queries de TanStack Query (`hooks/queries/`)
- `services/`: servicios (cobranzas, inventario, notificaciones)
- `lib/`: utilidades y cliente de API
- `firebase/`, `types/`

## Módulos principales

Envío y gestión de giros, usuarios, tasas de cambio, cuentas bancarias y transacciones, calculadoras,
reportes, inventario, configuración, logs y auditoría.

**Cobranzas** (`/cobranzas`, solo `SUPER_ADMIN`): Por cobrar, Préstamos (`/cobranzas/prestamos`) y
Clientes (`/cobranzas/clientes`).

Roles: `SUPER_ADMIN`, `ADMIN`, `TRANSFERENCISTA`, `MINORISTA`.

## Comandos

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev          # servidor de desarrollo en http://localhost:5173
npm run build        # tsc -b && vite build
npm run ts-check     # verificación de tipos
npm run lint         # ESLint
npm run format       # Prettier
npm run preview      # sirve la build de producción
```

## Variables de entorno

Copiar `.env.example` a `.env`.

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend (opcional; se autodetecta por hostname) |
| `VITE_PUBLIC_POSTHOG_KEY` | Clave pública de PostHog |
| `VITE_PUBLIC_POSTHOG_HOST` | Host de PostHog |
| `VITE_SHOW_WHATSAPP_FIELD` | Muestra el campo de WhatsApp (`true`/`false`) |
| `VITE_STORE_ENABLED` | Habilita subida de imagen y toggle de tienda (`true`/`false`) |
| `VITE_SHOW_COBRANZAS_MENU` | Muestra "Cobranzas" en el menú (`true`/`false`). Apagado por defecto: el módulo solo se abre por la URL `/cobranzas` y solo para SUPER_ADMIN |
