# Guía de Arquitecturas Web para Proyectos & E-Commerce

Guía y manual de referencia para la toma de decisiones arquitectónicas en proyectos web y comercio electrónico. Este documento establece los criterios para seleccionar la arquitectura adecuada (Monolito Embebido vs. Desacoplado Frontend/Backend), la elección del stack tecnológico (React vs. Angular vs. Mobile) y la correcta implementación de **Clean Architecture**.

---

## 🧭 1. Matriz de Decisión Arquitectónica

Antes de escribir una sola línea de código, evalúa el proyecto según estas variables:

| Tipo de Proyecto | Arquitectura Recomendada | Frontend | Backend | Justificación |
| :--- | :--- | :--- | :--- | :--- |
| **Landing Page / Catálogo Informativo** | Embebido Estático / JAMstack | HTML5 + CSS + Vanilla JS (o Astro) | Ninguno (o Headless CMS) | Cero costos de servidor, máxima velocidad, sin transacciones complejas. |
| **Tienda Online B2C (E-commerce / Retail)** | Desacoplada (Headless) con SSR | **React (Next.js)** | Node.js (NestJS / Express) + PostgreSQL | **Crítico:** SEO dinámico, render rápido en celulares, seguridad en pasarelas de pago y consistencia de inventario concurrente. |
| **Plataforma SaaS / App Corporativa** | Desacoplada (SPA Rica) | **Angular** o **React** | Node.js / Java Spring / .NET | Formularios complejos, validaciones estrictas en cliente y paneles administrativos de alta densidad de datos. |
| **Aplicación Móvil First (App Stores)** | Multiplataforma Híbrida / Nativa | **Ionic + Angular** o **React Native** | Backend API REST / GraphQL | Acceso a hardware móvil, notificaciones push nativas y distribución por tiendas oficiales. |

---

## ⚖️ 2. React vs. Angular: Criterio de Selección

### Cuándo elegir **React (Next.js)**
1. **Prioridad en SEO y Marketing:** Tiendas de ropa, blogs, marketplaces donde cada producto debe indexar en Google y mostrar previsualizaciones ricas (Open Graph) al compartir enlaces en WhatsApp o Instagram.
2. **Ecosistema de E-commerce y UI:** Facilidad para integrar librerías de carruseles táctiles (Swiper), animaciones fluidas (Framer Motion) y SDKs de checkout oficiales de pasarelas.
3. **Optimización de Bundle:** Menor peso de descarga inicial, vital para usuarios en conexiones móviles 3G/4G.
4. **Arquitectura:** Mayor flexibilidad para estructurar por componentes funcionales.

### Cuándo elegir **Angular**
1. **Paneles Administrativos y Dashboards:** Módulos internos de gestión (ERP, CRM, panel de inventario y pedidos para operadores de la tienda).
2. **Equipos Grandes con Necesidad de Estandarización:** Angular impone una estructura corporativa estricta con decoradores (`@Component`, `@Injectable`), TypeScript obligatorio e inyección de dependencias nativa.
3. **Formularios Reactivos Extensos:** Cuando una vista tiene decenas de campos interconectados con validaciones condicionales complejas.

---

## 🏛️ 3. Arquitectura Desacoplada: Frontend vs. Backend

Para proyectos con **pagos reales, logística y sincronización de stock**, la arquitectura **NUNCA** debe ser 100% embebida en el cliente. La separación de responsabilidades debe ser:

```
                    ┌────────────────────────────────────────┐
                    │          CLIENTE / FRONTEND            │
                    │      (Next.js / React / Angular)       │
                    │   - Interfaz de usuario reactiva       │
                    │   - Experiencia de compra fluida       │
                    │   - Captura de datos (sin secretos)    │
                    └───────────────────┬────────────────────┘
                                        │ HTTPS / JWT
                                        ▼
                    ┌────────────────────────────────────────┐
                    │           API / BACKEND CORE           │
                    │        (NestJS / Express / Go)         │
                    │   - Reglas de negocio transaccionales  │
                    │   - Control de concurrencia (Stock)    │
                    │   - Seguridad (Llaves privadas / Hash) │
                    └───────┬──────────────────────┬─────────┘
                            │                      │
              Webhooks / SDK│                      │ REST / SOAP
                            ▼                      ▼
             ┌─────────────────────────┐ ┌─────────────────────────┐
             │   PASARELA DE PAGOS     │ │ EMPRESA DE ENVIOS / CRM │
             │ (Wompi, MercadoPago...) │ │   (Inter Rapidísimo)    │
             └─────────────────────────┘ └─────────────────────────┘
```

### Límites Estrictos de Responsabilidad:
* **El Frontend se encarga de:**
  * Renderizado visual y adaptabilidad responsive.
  * Formateo de datos amigable para el usuario (monedas, fechas, estados).
  * Validación visual previa de formularios.
  * Captura segura de token de tarjeta de crédito (directo al SDK de la pasarela, sin tocar tu servidor).
* **El Backend se encarga de:**
  * Almacenar de forma segura tokens de autenticación de transportadoras y llaves secretas de pasarelas.
  * Validar firmas criptográficas de webhooks de pago (para confirmar que el dinero realmente ingresó a la cuenta antes de despachar).
  * Transacciones atómicas de base de datos (evitar sobreventa de una misma prenda).

---

## 🧱 4. Implementación de Clean Architecture en Frontend

Cuando se aplican principios limpios en el Frontend, el código debe organizarse en **4 capas concéntricas**. La regla de oro es que el núcleo ignora la existencia del navegador o del framework.

```
                      [ INFRASTRUCTURE & UI ]
                   (Views, Modals, Gestures, APIs)
                                 │
                                 ▼
                        [ INTERFACE ADAPTERS ]
                 (Controllers, Presenters, Storage)
                                 │
                                 ▼
                           [ APPLICATION ]
                    (Use Cases & Port Interfaces)
                                 │
                                 ▼
                             [ DOMAIN ]
                     (Entities & Value Objects)
```

### Estructura de Carpetas Recomendada (Template):

```text
src/
├── domain/                      # CAPA 1: Dominio Puro (Sin dependencias externas)
│   ├── entities/                # Entidades con identidad única (Product, Order, User)
│   └── value-objects/           # Objetos inmutables por valor (Money, Email, Address)
│
├── application/                 # CAPA 2: Casos de Uso del Sistema
│   ├── ports/                   # Interfaces / Contratos (IProductRepo, IPaymentGateway)
│   └── use-cases/               # Flujos orquestados (AddToCart, TrackOrder, ApplyCoupon)
│
├── adapters/                    # CAPA 3: Adaptadores de Interfaz
│   ├── controllers/             # Manejadores de eventos de UI que invocan Casos de Uso
│   ├── presenters/              # Adaptadores de datos para formatear hacia la UI (ViewModels)
│   └── repositories/            # Implementación concreta de los puertos (Fetch, LocalStorage)
│
└── infrastructure/              # CAPA 4: Detalles Técnicos y Framework
    ├── ui/                      # Vistas divididas por componente (Evitar clases dios monolíticas)
    │   ├── views/               # Vistas específicas (CatalogView, CartView, CheckoutView)
    │   └── components/          # Componentes reutilizables (Modals, Toasts, Drawers)
    └── external/                # SDKs de terceros (Google Pay, Analytics, Pixels)
```

---

## 🚫 5. Errores Comunes a Evitar en Futuros Proyectos

1. **La "Clase Dios" de Renderizado:** Acumular todo el manejo del DOM en un único archivo de cientos de líneas (`DomRenderer` o `app.js`). Cada vista o componente debe manejar su propio ciclo de vida.
2. **Duplicidad de Reglas de Negocio:** Tener valores o lógicas repetidas en archivos estáticos y en entidades de dominio (por ejemplo, definir costos de envío en el catálogo y a la vez en las clases de dominio).
3. **Lógica Transaccional en el Cliente:** Permitir que el frontend decida si una orden fue pagada con éxito o calcular totales finales sin confirmación del servidor.
4. **Acoplamiento Directo al Framework:** Mezclar lógica de negocio directamente dentro de hooks de React o servicios de Angular sin casos de uso puros intermedios, impidiendo migrar de framework a futuro.
