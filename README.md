# App Control de Combustible

Sistema de control y seguimiento de consumo de combustible para vehículos.

## 🚀 Tecnologías

- **Next.js 15** (React Framework)
- **TypeScript** (Tipado estático)
- **Tailwind CSS** (Estilos)
- **Supabase** (Base de datos PostgreSQL + Backend)

## 📋 Prerequisitos

- Node.js 18+ instalado
- Cuenta en Supabase (https://supabase.com)
- Base de datos configurada en Supabase

## 🔧 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

**¿Dónde encontrar estos valores?**

1. Entra a tu proyecto en Supabase
2. Ve a Settings → API
3. Copia "Project URL" → NEXT_PUBLIC_SUPABASE_URL
4. Copia "anon public" key → NEXT_PUBLIC_SUPABASE_ANON_KEY

### 3. Verificar base de datos

Asegúrate de que tu base de datos en Supabase tenga estas tablas:

- `vehiculos`
- `marcas_estacion`
- `estaciones_servicio`
- `registros_combustible`
- `motorizacion_tipos`
- `paises`, `departamentos`, `municipios`

## 🏃‍♂️ Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
combustible-app/
├── app/                      # App Router de Next.js
│   ├── layout.tsx           # Layout principal con navegación
│   ├── page.tsx             # Página de inicio
│   ├── globals.css          # Estilos globales
│   └── registros/
│       └── nuevo/
│           └── page.tsx     # Formulario de nuevo registro
├── components/              # Componentes reutilizables (futuro)
├── lib/
│   └── supabase.ts         # Cliente de Supabase + tipos
├── public/                  # Archivos estáticos
├── .env.local              # Variables de entorno (no commiteado)
├── next.config.js          # Configuración de Next.js
├── tailwind.config.ts      # Configuración de Tailwind
└── package.json            # Dependencias
```

## 🎯 Funcionalidades Implementadas

### ✅ Completado

- [x] Configuración inicial del proyecto
- [x] Integración con Supabase
- [x] Layout con navegación
- [x] Página de inicio
- [x] Formulario de registro de combustible
  - Selección de vehículo
  - Campos de kilometraje
  - Galones y valor
  - Km/litro según computadora
  - Marca y estación de servicio
  - Tipo de recorrido
  - Validaciones básicas
  - Guardado en base de datos

### 🔜 Próximos Pasos

- [ ] Página de listado de registros
- [ ] Visualización de datos calculados
- [ ] Página de vehículos
- [ ] Formulario para agregar vehículos
- [ ] Gráficos de rendimiento
- [ ] Filtros y búsqueda
- [ ] Estadísticas por vehículo

## 🔑 Características del Formulario

El formulario de registro incluye:

- **Selects dinámicos**: Las estaciones se filtran según la marca seleccionada
- **Validación**: Todos los campos obligatorios están validados
- **Feedback**: Mensajes de éxito/error al guardar
- **Responsive**: Funciona en móvil y desktop
- **Limpieza automática**: El formulario se limpia después de guardar

## 🐛 Solución de Problemas

### Error: "Invalid API Key"

Verifica que:
- Las variables de entorno estén bien configuradas en `.env.local`
- El archivo `.env.local` esté en la raíz del proyecto
- Hayas reiniciado el servidor después de crear `.env.local`

### No aparecen datos en los selects

Verifica que:
- Tengas datos en las tablas de Supabase
- Las políticas RLS permitan lectura pública (temporal para desarrollo)
- La conexión a Supabase sea correcta

### Error al guardar

Revisa:
- Que todos los campos estén completos
- Que los valores numéricos sean válidos
- La consola del navegador para más detalles

## 📝 Notas de Desarrollo

- **TypeScript**: El proyecto usa TypeScript para mayor seguridad de tipos
- **Client Components**: El formulario usa `'use client'` porque necesita interactividad
- **Supabase**: La conexión se hace mediante el cliente JavaScript oficial
- **Tailwind**: Estilos utilitarios para desarrollo rápido

## 🚀 Deploy (Próximo)

Para deployar en Vercel:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

No olvides configurar las variables de entorno en Vercel.

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

---

**Desarrollado como proyecto de aprendizaje**
Stack: Next.js + TypeScript + Tailwind + Supabase

## Upload a GitHub y publicación en Vercel (Se supone que automaticamnete Vercel lo detecta)

git add .
git commit -m "Fix: Corregir errores de ESLint para deploy en Vercel"
git push


