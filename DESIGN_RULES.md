# Reglas de Diseño Mobile-First - Frontend Los Chamos

## Stack Tecnológico

### Core
- **React 19** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS framework (mobile-first by default)
- **shadcn/ui** - Component system based on Radix UI

### Librerías Clave
- **@radix-ui/react-*** - Componentes UI accesibles y headless
- **lucide-react** - Iconos
- **react-hook-form** + **@hookform/resolvers** + **zod** - Formularios y validación
- **@tanstack/react-query** - Data fetching y cache
- **react-router-dom** - Routing
- **next-themes** - Dark mode
- **sonner** - Toasts/notificaciones
- **vaul** - Drawer mobile-native
- **date-fns** - Manejo de fechas
- **class-variance-authority** - Variantes de componentes
- **tailwind-merge** + **clsx** - Merge de clases

### PWA
- **vite-plugin-pwa** - PWA support con Workbox

---

## 1. Sistema de Colores (HSL Variables)

### Light Mode
```css
--background: 210 20% 98%;      /* Fondo principal */
--foreground: 215 25% 15%;      /* Texto principal */
--card: 0 0% 100%;              /* Tarjetas */
--primary: 214 84% 56%;         /* Color primario (azul) */
--accent: 174 72% 56%;          /* Acento (turquesa) */
--success: 142 76% 36%;         /* Verde éxito */
--warning: 38 92% 50%;          /* Naranja advertencia */
--destructive: 0 84% 60%;       /* Rojo error */
--muted: 210 15% 95%;           /* Fondos sutiles */
--border: 214 20% 88%;          /* Bordes */
```

### Dark Mode
```css
--background: 215 28% 10%;
--foreground: 210 20% 95%;
--card: 215 25% 13%;
--primary: 214 84% 60%;
--accent: 174 72% 56%;
/* ... etc */
```

### Gradientes
```css
--gradient-primary: linear-gradient(135deg, hsl(214 84% 56%), hsl(200 84% 64%));
--gradient-accent: linear-gradient(135deg, hsl(174 72% 56%), hsl(160 72% 64%));
```

### Sombras
```css
--shadow-card: 0 2px 8px -2px hsl(214 20% 70% / 0.15);
--shadow-elevated: 0 8px 24px -4px hsl(214 20% 60% / 0.2);
```

---

## 2. Breakpoints (Mobile-First)

Tailwind usa mobile-first, por lo que **NO** usas `max-width`:

```tsx
// ❌ INCORRECTO
<div className="max-md:hidden">...</div>

// ✅ CORRECTO - Mobile primero
<div className="hidden md:block">...</div>
```

### Breakpoints estándar
```
default:  < 640px   (Mobile)
sm:       ≥ 640px   (Phablet)
md:       ≥ 768px   (Tablet)
lg:       ≥ 1024px  (Desktop)
xl:       ≥ 1280px  (Large Desktop)
2xl:      ≥ 1400px  (Ultra Wide)
```

---

## 3. Espaciado y Tipografía

### Spacing Mobile-First
```tsx
// Padding responsive
className="p-4 md:p-6"           // 16px mobile, 24px desktop
className="px-4 py-6"            // Horizontal 16px, Vertical 24px

// Gaps en grids
className="gap-3 md:gap-4"       // 12px mobile, 16px desktop
```

### Tipografía Responsive
```tsx
// Títulos
className="text-2xl md:text-3xl font-bold"

// Subtítulos
className="text-xs md:text-sm text-muted-foreground"

// Iconos
className="w-4 h-4 md:w-5 md:h-5"
```

---

## 4. Layout Patterns

### Container Principal
```tsx
<div className="min-h-screen bg-background pb-20 md:pb-6">
  {/* pb-20 para mobile nav, pb-6 para desktop */}
</div>
```

### Max Width Container
```tsx
<div className="max-w-7xl mx-auto px-4">
  {/* Contenido centrado con padding lateral */}
</div>
```

### Grid Responsive
```tsx
// 2 columnas mobile, 4 desktop
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard />
  <StatCard />
</div>

// 1 columna mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## 5. Componentes Mobile-First

### Mobile Navigation (Bottom Bar)
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 md:hidden">
  <div className="grid grid-cols-5 h-16">
    {/* Navegación móvil */}
  </div>
</nav>
```

### Sidebar (Desktop Only)
```tsx
<aside className="hidden md:flex md:w-64 md:flex-col">
  {/* Sidebar desktop */}
</aside>
```

### Cards Responsive
```tsx
<Card className="shadow-card hover:shadow-elevated transition-shadow">
  <CardContent className="p-4 md:p-6">
    {/* Padding adaptativo */}
  </CardContent>
</Card>
```

### Buttons Mobile-Friendly
```tsx
// Touch targets mínimos 44x44px
<Button className="h-auto py-4 flex flex-col gap-2">
  <Icon className="w-6 h-6" />
  <span className="text-xs">Label</span>
</Button>
```

---

## 6. Patrones de Componentes

### StatCard Pattern
```tsx
interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "primary" | "success" | "warning" | "accent";
}
```

### Gradientes en Headers
```tsx
<header className="bg-gradient-primary text-white p-4 md:p-6 shadow-elevated">
  {/* Header con gradiente */}
</header>
```

### Acciones Rápidas
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
    <Icon className="w-6 h-6" />
    <span className="text-xs">Acción</span>
  </Button>
</div>
```

---

## 7. Formularios (react-hook-form + zod)

### Patrón de Validación
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  monto: z.number().min(1, "Monto mínimo: 1"),
});

type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { email: "", monto: 0 },
});
```

---

## 8. PWA Configuration

### Manifest
```ts
manifest: {
  name: "Sistema de Giros",
  short_name: "GirosApp",
  description: "PWA para gestionar giros y transferencias",
  theme_color: "#3b82f6",
  background_color: "#ffffff",
  display: "standalone",
  orientation: "portrait",
  scope: "/",
  start_url: "/",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
}
```

### Workbox Caching
```ts
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
  ],
}
```

---

## 9. Aliases de Importación

```json
{
  "@/components": "./src/components",
  "@/lib": "./src/lib",
  "@/hooks": "./src/hooks",
  "@/utils": "./src/lib/utils"
}
```

### Uso
```tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
```

---

## 10. Dark Mode

### Configuración
```tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>
```

### Toggle
```tsx
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
```

---

## 11. Toasts (Sonner)

```tsx
import { toast } from "sonner";

// Success
toast.success("Giro creado exitosamente");

// Error
toast.error("Error al procesar el giro");

// Custom
toast("Procesando...", {
  description: "Esto puede tardar unos segundos",
  duration: 5000,
});
```

---

## 12. Mobile Drawer (Vaul)

```tsx
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

<Drawer>
  <DrawerTrigger>Abrir</DrawerTrigger>
  <DrawerContent>
    {/* Contenido del drawer desde abajo */}
  </DrawerContent>
</Drawer>
```

---

## 13. Best Practices

### Touch Targets
- Mínimo **44x44px** para elementos touch
- Usar `py-4` en botones mobile

### Performance
- Lazy load de rutas con `React.lazy()`
- Imágenes optimizadas con `srcset`
- Code splitting por ruta

### Accesibilidad
- Usar componentes Radix (ya accesibles)
- Labels en todos los inputs
- Focus visible en navegación con teclado

### SEO & Meta Tags
```html
<meta name="theme-color" content="#3b82f6">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## 14. Estructura de Carpetas

```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── MobileNav.tsx
│   └── StatCard.tsx
├── pages/               # Rutas
├── hooks/               # Custom hooks
├── lib/
│   └── utils.ts         # cn(), helpers
├── App.tsx
└── main.tsx
```

---

## 15. Utilities

### cn() - Class Name Merger
```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uso
className={cn("text-sm", isActive && "text-primary")}
```

---

## Comandos Útiles

```bash
# Instalar shadcn component
npx shadcn@latest add button

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## Recursos
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
