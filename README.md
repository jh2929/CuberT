# ⏱️ CuberT

<div align="center">

![CuberT Banner](https://raw.githubusercontent.com/jh2929/CuberT/main/public/favicon.svg)

### Modern, Minimalist & Professional Speedcubing Web App

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WCA Compliant](https://img.shields.io/badge/WCA-Compliant%20Scrambles-00FF66?style=flat)](https://www.worldcubeassociation.org/)
[![Offline First](https://img.shields.io/badge/PWA-100%25%20Offline-success)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Diseñado para speedcubers exigentes: rápido, preciso, estético y 100% offline.*

[Características](#-características) • [Instalación](#-instalación) • [Atajos de Teclado](#-atajos-de-teclado) • [Tecnologías](#-stack-tecnológico) • [Estructura](#-arquitectura-del-proyecto)

</div>

---

## ⚡ Acerca de CuberT

**CuberT** es un cronómetro profesional para cubos de Rubik enfocado en la **velocidad, precisión milimétrica y una estética minimalista premium** inspirada en los principios de diseño de Apple, Linear y Raycast.

A diferencia de los timers tradicionales saturados, CuberT ofrece una interfaz oscura OLED pura (`#000000`) con detalles verde neón (`#00FF66`), una barra lateral flotante inspirada en Apple Music y un modo de resolución inmersivo que centra el tiempo en toda la pantalla sin ninguna distracción.

---

## ✨ Características

### ⏱️ Cronómetro Profesional
- **Medición de precisión:** Basado en `performance.now()` con medición exacta a nivel de milisegundos y visualización configurable (centésimas o milésimas).
- **Modo Inmersivo al Resolver:** Al soltar la barra espaciadora, la interfaz secundaria se oculta y el tiempo pasa al centro geométrico exacto de la pantalla.
- **Parada instantánea:** Un solo toque a la barra espaciadora o clic/touch en cualquier lugar de la pantalla detiene el tiempo inmediatamente.
- **Inspección oficial WCA (15 segundos):** Cuenta atrás discreta con alertas de audio a los 8 y 12 segundos, y aplicación automática de penalizaciones (+2 después de 15s, DNF después de 17s).
- **Control de retardo (Hold Delay):** Configuración de 300ms, 500ms o 700ms para evitar falsos arranques.

### 🎲 Scrambles Oficiales WCA
- Generador respaldado por `@cubing/scramble` y `cubing.js` conforme a la normativa WCA:
  - **Cubos:** 2x2, 3x3, 4x4, 5x5, 6x6, 7x7
  - **Especiales WCA:** Pyraminx, Megaminx, Skewb, Square-1, Clock
  - **Variantes:** 3x3 One-Handed (OH), 3x3 Blindfolded (BLD)
- Historial de scrambles: avanzar, retroceder y copiar scramble con un clic.
- **Visualizador 2D ("Desarmado por caras"):** Muestra el estado del cubo desplegado con los colores reales generados por el algoritmo de scramble.

### 📊 Estadísticas Completas WCA
- **Indicadores en tiempo real:**
  - PB Single (Mejor tiempo personal) con celebración discreta de confeti.
  - Ao5, Ao12 y Ao100 calculados con los algoritmos oficiales WCA (descarte del 5% superior/inferior y manejo correcto de DNF).
  - Media global (Session Average) y mejores averages históricos (Best Ao5, Best Ao12, Best Ao100).
- **Panel de estadísticas avanzado:**
  - Gráfico de dispersión interactivo con líneas de tendencia para tiempo individual, Ao5 y Ao12.
  - Histograma de distribución de tiempos por rangos dinámicos.
  - Resumen de consistencia (desviación típica).

### 📁 Gestión de Sesiones e Historial
- Múltiples sesiones independientes con estadísticas y eventos separados (ej. *Práctica matutina*, *OLL Trainer*, *Competición*).
- Historial interactivo: edita penalizaciones (+2, DNF, OK), agrega notas a cada solve o elimínalos con opción inmediata de **Deshacer (Undo)**.

### 🖼️ Exportación y Compartición de Solves
- Generador integrado de **tarjetas en imagen PNG de alta resolución (Retina 2x)** con estética dark OLED.
- Muestra el tiempo final, penalización, fecha, sesión, scramble completo y notas.
- Compatible con **Web Share API** (móviles y navegadores modernos) y copia directa al portapapeles.

### 🔒 Privacidad y Funcionamiento 100% Offline
- **Cero backend, cero cuentas requeridas:** Todos los datos se almacenan localmente en el navegador mediante **IndexedDB** (con fallback a `localStorage`).
- **PWA (Progressive Web App):** Instalable en escritorio y dispositivos móviles con service workers para funcionar totalmente desconectado.
- **Sistema de Copia de Seguridad:** Exportación e importación en formato JSON estandarizado (reemplazo o combinación inteligente) con recordatorio configurable tras *N* solves.

---

## ⌨️ Atajos de Teclado

Diseñado para una experiencia fluida sin necesidad de levantar las manos del teclado:

| Tecla / Combinación | Acción |
| :--- | :--- |
| <kbd>Espacio</kbd> *(mantener)* | Preparar el cronómetro (indicador verde) |
| <kbd>Espacio</kbd> *(soltar)* | Iniciar el tiempo |
| <kbd>Espacio</kbd> o <kbd>Cualquier tecla</kbd> | Detener el tiempo inmediatamente |
| <kbd>F</kbd> | Alternar **Modo Focus** (oculta la barra lateral) |
| <kbd>Esc</kbd> | Salir de Focus / Cerrar modal activo / Cancelar solve |
| <kbd>2</kbd> | Alternar penalización **+2** en el último solve |
| <kbd>D</kbd> | Alternar penalización **DNF** en el último solve |
| <kbd>Alt</kbd> + <kbd>N</kbd> | Generar **Siguiente Scramble** |
| <kbd>Alt</kbd> + <kbd>Z</kbd> | **Deshacer (Undo)** última eliminación de solve |

---

## 🛠️ Stack Tecnológico

* **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite 8](https://vitejs.dev/)
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Animaciones:** [Framer Motion](https://www.framer.com/motion/) & [Canvas Confetti](https://github.com/catdad/canvas-confetti)
* **Iconos:** [Lucide React](https://lucide.dev/)
* **Scrambles y Visualización:** [`@cubing/scramble`](https://js.cubing.net/cubing/) & [`cubing/kpuzzle`](https://js.cubing.net/cubing/kpuzzle/)
* **Almacenamiento Local:** IndexedDB con fallback reactivo en Zustand y Web Storage API
* **PWA:** `vite-plugin-pwa` con Workbox
* **Testing:** [Vitest](https://vitest.dev/)
* **Linter:** [Oxlint](https://oxc.rs/)

---

## 🚀 Instalación y Desarrollo

### Requisitos previos
- [Node.js](https://nodejs.org/) v18+ o superior
- [npm](https://www.npmjs.com/) o [pnpm](https://pnpm.io/)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/jh2929/CuberT.git
   cd CuberT
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Ejecutar pruebas unitarias:**
   ```bash
   npm test
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📂 Arquitectura del Proyecto

```text
src/
├── components/             # Componentes modulares de interfaz
│   ├── backup/             # Componentes de exportación e importación
│   ├── icons/              # Iconografía personalizada (favicons, badges)
│   ├── scramble/           # Renderizado de scramble y visualizador de caras 2D
│   ├── sessions/           # Gestor modal de sesiones
│   ├── settings/           # Panel de configuración y preferencias
│   ├── sidebar/            # Barra lateral flotante estilo Apple Music
│   ├── solves/             # Historial y modal de detalle / exportación de imagen
│   ├── stats/              # Indicadores PB/Ao5/Ao12, gráficos e histogramas
│   ├── timer/              # Cronómetro, pantalla de dígitos y estado
│   └── ui/                 # Modales accesibles con portales, botones y badges
├── features/               # Lógica de dominio desacoplada y testeable
│   ├── backup/             # Serialización, validación y backup JSON
│   ├── scramble/           # Integración con algoritmos oficiales WCA
│   ├── statistics/         # Algoritmos WCA oficiales (Ao5, Ao12, Ao100, Best, PB)
│   └── timer/              # Máquina de estados del timer con performance.now()
├── hooks/                  # Custom hooks (teclado, audio, temas)
├── store/                  # Gestión de estado global reactivo (Zustand + IndexedDB)
├── types/                  # Definiciones de tipos TypeScript estrictas
└── utils/                  # Utilidades (formateo de tiempos, generador de imagen PNG)
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
