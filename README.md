# Frontend - Cambios Los Chamos

Aplicación web para la gestión de remesas "Cambios Los Chamos". Desarrollada con React, Vite y TypeScript, enfocada en una experiencia de usuario rápida y moderna.

## 🛠 Tecnologías Principales

- **Framework:** React + Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **UI Kit:** Shadcn UI (Radix UI + Lucide Icons)
- **Gestión de Estado/Data:** TanStack Query (React Query)
- **Formularios:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Notificaciones:** Sonner (Toasts)

## 🚀 Requisitos Previos

- Node.js (v18 o superior)

## 📦 Instalación

1.  Navegar a la carpeta `frontend`.
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Configurar variables de entorno:
    - Crear un archivo `.env` basado en `.env.example` si es necesario (generalmente para definir la URL del API).

## 🏃‍♂️ Ejecución

### Desarrollo
Para iniciar el servidor de desarrollo local:
```bash
npm run dev
```
La aplicación estará disponible típicamente en `http://localhost:5173`.

### Producción
Para construir la aplicación para producción:
```bash
npm run build
```
Para previsualizar la build localmente:
```bash
npm run preview
```

## 🧩 Estructura del Proyecto

- `src/components`: Componentes reutilizables (Botones, Inputs, Layouts).
- `src/pages`: Componentes de página (Vistas principales).
- `src/hooks`: Hooks personalizados (Lógica de negocio, React Query).
- `src/context`: Contextos de React (Auth, Theme).
- `src/lib`: Utilidades y configuraciones (Axios client, utils).

## 🧪 Calidad de Código

- **Linting:** `npm run lint`
- **Formateo:** `npm run format`
- **Chequeo de Tipos:** `npm run ts-check`
