# MONARCC — Arquitectura Frontend & Documentación de Vistas

Documento técnico que detalla la arquitectura de software, organización de carpetas y descomposición de vistas para el frontend de la tienda web oficial de **MONARCC** (`@_monarcc_store`).

---

## 🏛️ Filosofía Arquitectónica: Clean Architecture en Frontend

El frontend está estructurado siguiendo estrictamente **Clean Architecture (Robert C. Martin)** junto con el principio de responsabilidad única (SRP). 

El objetivo primordial es que **las reglas de negocio y los casos de uso sean totalmente independientes de la interfaz de usuario (DOM), frameworks y APIs del navegador**.

```
                ┌───────────────────────────────────────────────┐
                │          INFRASTRUCTURE / UI (DOM)            │
                │   (Views, Modals, Drawers, Gestures, APIs)    │
                │                       │                       │
                │                       ▼                       │
                │             INTERFACE ADAPTERS                │
                │     (Controllers, Presenters, Repositories)   │
                │                       │                       │
                │                       ▼                       │
                │           APPLICATION (USE CASES)             │
                │         (Orquestación & Ports/Interfaces)     │
                │                       │                       │
                │                       ▼                       │
                │             DOMAIN (CORE PURO)                │
                │           (Entities & Value Objects)          │
                └───────────────────────────────────────────────┘
                     * La dependencia fluye siempre hacia el centro *
```

---

## 📁 Estructura Organizacional del Proyecto (Frontend)

```text
monarcc-store/
│
├── index.html                           # Estructura semántica estática y contenedores de vista
├── style.css                            # Sistema de diseño, tokens, grillas y temas visuales
│
├── data/                                # Capa de datos desacoplada del código fuente
│   ├── catalog.json                     # Catálogo oficial de prendas, stock y fotos
│   └── exports/                         # Respaldos de catálogo (Shopify, WooCommerce, etc.)
│
├── media/                               # Recursos estáticos (JPG, MP4, SVG vectoriales)
│
├── tests/                               # Suite de pruebas unitarias e integración
│   ├── unit/                            # Tests puros de entidades y objetos de valor
│   └── integration/                     # Tests de casos de uso y repositorios
│
└── src/                                 # Código fuente modularizado
    │
    ├── index.js                         # Composition Root (Inyección de dependencias)
    │
    ├── domain/                          # CAPA 1: Reglas de Negocio del Negocio (Puro JS)
    │   ├── value-objects/
    │   │   └── Money.js                 # Manejo inmutable de montos en COP y formato
    │   └── entities/
    │       ├── Product.js               # Entidad producto (tallas, variantes, stock)
    │       ├── Cart.js                  # Aggregate Root de la orden de compra
    │       ├── CartItem.js              # Línea individual de ítem en la bolsa
    │       ├── Coupon.js                # Validación y porcentaje de descuento
    │       ├── ShippingRate.js          # Lógica de zonas y regla de envío gratis
    │       └── TrackingGuide.js         # Máquina de estados de logística nacional
    │
    ├── application/                     # CAPA 2: Casos de Uso y Puertos
    │   ├── ports/                       # Interfaces / Contratos abstractos
    │   │   ├── IProductRepository.js    # Contrato para obtención del catálogo
    │   │   ├── IStorageService.js       # Contrato para persistencia de sesión
    │   │   └── IPaymentGateway.js       # Contrato para pasarelas de pago
    │   └── use-cases/                   # Orquestación de acciones del usuario
    │       ├── AddToCartUseCase.js
    │       ├── UpdateCartItemQtyUseCase.js
    │       ├── RemoveCartItemUseCase.js
    │       ├── ApplyCouponUseCase.js
    │       ├── CalculateOrderTotalsUseCase.js
    │       ├── FilterCatalogUseCase.js
    │       ├── TrackShipmentUseCase.js
    │       └── UnlockVipUseCase.js
    │
    ├── adapters/                        # CAPA 3: Adaptadores de Interfaz
    │   ├── controllers/                 # Escuchan intenciones de UI y ejecutan Use Cases
    │   │   ├── CatalogController.js
    │   │   ├── CartController.js
    │   │   ├── TrackingController.js
    │   │   └── VipController.js
    │   ├── presenters/                  # Transforman entidades a ViewModels para el DOM
    │   │   ├── ProductPresenter.js
    │   │   ├── CartPresenter.js
    │   │   ├── TrackingPresenter.js
    │   │   └── CurrencyPresenter.js
    │   └── repositories/                # Implementación de puertos abstractos
    │       ├── StaticProductRepository.js
    │       └── LocalStorageService.js
    │
    └── infrastructure/                  # CAPA 4: Infraestructura y UI Concreta (DOM)
        ├── external/                    # Drivers de servicios externos
        │   ├── GooglePayGateway.js      # Integración con Google Pay SDK
        │   └── WhatsAppCheckout.js      # Generador de enlaces para pedidos por WhatsApp
        │
        └── ui/                          # Vistas y componentes visuales del DOM
            ├── views/                   # Vistas principales modulares (SRP)
            │   ├── CatalogView.js       # Renderizado de cards, sliders y breakers
            │   ├── CartDrawerView.js    # Bolsa lateral, selectores de zona y checkout
            │   ├── FilterSidebarView.js # Panel deslizable de filtros avanzados y rangos
            │   ├── QuickViewModal.js    # Modal flotante de inspección rápida
            │   ├── TrackingView.js      # Formulario y timeline de seguimiento de guía
            │   └── VipModalView.js      # Modal interactivo del Círculo Monarca
            ├── components/              # Elementos transversales de interfaz
            │   ├── Preloader.js         # Pantalla de carga y barra de porcentaje
            │   ├── ScreenTransition.js  # Efecto cinemático de cambio de sección
            │   ├── ToastNotifier.js     # Notificaciones flotantes temporales
            │   └── CountdownTimer.js    # Reloj de cuenta regresiva para drops
            └── listeners/               # Controladores táctiles y de hardware
                ├── MobileDock.js        # Dock táctil inferior reactivo al scroll
                └── TouchGestures.js     # Swipes e interacciones gestuales
```

---

## 🖥️ Descomposición de Vistas del Frontend

El frontend opera como una **Single Page Application (SPA)** modular dividida en tres tipos de vistas superpuestas:

### 1. Secciones de Flujo Vertical (Scroll Continuo)
* **Preloader (`Preloader.js`):** Pantalla de carga con indicador porcentual (0–100%) y dibujo vectorial del logo. Se oculta al inicializar los componentes.
* **Header Principal (`#main-header`):** Barra superior sticky con efecto glassmorphism. Incluye buscador reactivo, stock global en vivo, acceso al carrito y trigger de easter egg.
* **Hero Section (`#hero`):** Portada editorial con tipografía de alto impacto, llamada a la acción y visualizador de piezas limitadas.
* **Sección Beneficios (`.section-benefits`):** Puntos clave de propuesta de valor (envíos nacionales, confección local en Soacha, política sin contraentrega).
* **Catálogo & Breakers (`CatalogView.js`):**
  * Cuadrícula de productos con carrusel de imágenes individual, selector de tallas y variantes de color.
  * *Drop Breaker:* Módulo con cuenta regresiva en vivo para el próximo drop.
  * *Video Lookbooks:* Bloques dobles de video vertical (9:16) con audio conmutable.
  * *Season Breaker:* Anuncio de ofertas de temporada.
  * *Card VIP Oculta:* Prenda bloqueada que se revela solo al cumplir el flujo de desbloqueo.
* **Rastreador Logístico (`TrackingView.js`):** Consulta en tiempo real de números de guía de 12 dígitos de Inter Rapidísimo con máquina de 4 estados visuales.
* **Social Proof (`#reviews`):** Reseñas de clientes con puntuaciones y verificación.
* **Acerca de (`#about`):** Manifiesto de la marca, textiles pesados y detalles de confección en Cundinamarca.
* **Footer (`.footer`):** Enlaces directos a Instagram, WhatsApp de atención y términos legales.

### 2. Paneles Laterales Deslizables (Drawers)
* **Sidebar de Filtros (`FilterSidebarView.js`):** Panel lateral izquierdo para filtrar por categorías, rangos de precio en COP, tallas y colores sin recargar la página.
* **Bolsa de Compras (`CartDrawerView.js`):** Panel lateral derecho que despliega los ítems seleccionados, selector dinámico de destino para cálculo de flete nacional, cálculo de envío gratis ($\ge \$300.000$ COP), redención de cupones y accesos directos de pago (Google Pay, Tarjeta, WhatsApp).

### 3. Vistas Emergentes (Modales)
* **Modal Vista Rápida (`QuickViewModal.js`):** Galería táctil swipeable en alta resolución con selección de variantes y adición directa al carrito.
* **Modal de Cupones (`#discount-modal`):** Listado de códigos activos con copiado automático al portapapeles.
* **Modal de Pago con Tarjeta (`#card-modal`):** Formulario cifrado con validación de campos para transacciones.
* **Modal de Confirmación (`#success-modal`):** Notificación de compra exitosa con asignación de orden `#MN-XXXXXX` y número de guía.
* **Modal Secreto VIP (`VipModalView.js`):** Revelación de la prenda exclusiva y asignación automática de cupón de descuento.

---

## ⚙️ Reglas de Aislamiento y Calidad de Código

1. **Aislamiento del Dominio:** Ningún archivo dentro de `src/domain/` o `src/application/` puede contener referencias a `window`, `document`, `localStorage` ni librerías de terceros.
2. **Desacoplamiento de Vistas:** `DomRenderer.js` se divide en vistas individuales por módulo (`ui/views/`) para evitar archivos monolíticos y facilitar el mantenimiento.
3. **Punto Único de Inyección:** `src/index.js` es el único responsable de instanciar casos de uso, repositorios y vincularlos a los controladores y vistas.
