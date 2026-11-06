# MONARCC — Luxury Streetwear Store 👑

> Tienda web oficial de **MONARCC** (`@_monarcc_store`) — Moda urbana contemporánea masculina (Hoodies • Chaquetas • Sudaderas • Conjuntos), *Made in Soacha, Colombia*.

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://monarcc-store.pages.dev)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%2010%2F10-00C7B7?style=for-the-badge)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](#)

🌐 **Demo en vivo:** [https://monarcc-store.pages.dev](https://monarcc-store.pages.dev)

---

## ✨ Características Principales

* **Estética Clean Luxury & Editorial**: Geometría refinada con bordes redondeados (14px–24px), paleta Oro Champagne (`#C5A46D`), Negro Obsidiana (`#0A0A0A`) y acentos de alto contraste.
* **Ritmo Visual cada 4 Prendas (Breakers)**:
  * Drop Próximo con cuenta regresiva en vivo (*Drop Pista 2026*).
  * Lookbooks en Video (Formato vertical 9:16 en bloques de 2 reels con audio conmutable).
  * Sección destacada de Ofertas de Temporada con etiquetas dinámicas.
* **Transiciones Cinemáticas SVG**: Efecto de auto-dibujado láser vectorial del isotipo de la corona y la tipografía de MONARCC entre secciones y filtros.
* **Navegación Móvil Avanzada**:
  * Dock táctil flotante con auto-ocultamiento cinemático al hacer scroll hacia abajo y reaparición fluida al subir.
  * Soporte táctil *Touch Swipe* para galerías horizontales de tarjetas y modal de vista rápida.
* **Logística Nacional & Inter Rapidísimo**:
  * Calculadora de envíos dinámica por departamento y municipio (tarifas local, regional, nacional y especial).
  * Regla de **Envío Gratis** automático para órdenes superiores a `$300.000 COP`.
  * Rastreador interactivo en tiempo real para números de guía de 12 dígitos.
* **Pasarela de Pagos & Checkout**:
  * Drawer lateral con botones de **Google Pay**, formulario cifrado de tarjetas y enlace directo de pedido a **WhatsApp**.
  * Políticas de despacho estricto sin pago contraentrega.
* **Easter Egg VIP Secreto (Círculo Monarca)**:
  * Desbloqueable mediante triple toque en la corona o escribiendo `monarcc` en cualquier parte del teclado.
  * Otorga acceso a la pieza secreta exclusiva (*Chaqueta Oro Imperial*) y aplica el cupón `CROWNVIP10`.

---

## 🏛️ Arquitectura de Software: Clean Architecture

El proyecto está diseñado siguiendo estrictamente los principios de **Clean Architecture (Robert C. Martin)**, garantizando que las reglas de negocio sean completamente independientes del DOM, librerías o navegadores.

```
                      [ INFRASTRUCTURE ]
                   (DOM, UI Drivers, Gateways)
                               │
                               ▼
                      [ INTERFACE ADAPTERS ]
               (Controllers, Presenters, Repositories)
                               │
                               ▼
                         [ APPLICATION ]
                     (Use Cases & Port Interfaces)
                               │
                               ▼
                           [ DOMAIN ]
                   (Entities & Value Objects)
```

### Estructura del Código

```text
src/
├── domain/                      # Capa 1: Reglas de Negocio Empresariales
│   ├── value-objects/
│   │   └── Money.js             # Objeto de valor inmutable (Aritmética COP)
│   └── entities/
│       ├── Cart.js              # Aggregate Root de la bolsa de compras
│       ├── CartItem.js          # Entidad de línea de pedido
│       ├── Coupon.js            # Entidad y validación de cupones
│       ├── Product.js           # Entidad de producto e inventarios
│       ├── ShippingRate.js      # Tarifas y regla de envío gratis
│       └── TrackingGuide.js     # Máquina de estados de guía Inter Rapidísimo
├── application/                 # Capa 2: Casos de Uso y Puertos
│   ├── ports/
│   │   ├── IProductRepository.js
│   │   └── IStorageService.js
│   └── use-cases/
│       ├── AddToCartUseCase.js
│       ├── ApplyCouponUseCase.js
│       ├── CalculateOrderTotalsUseCase.js
│       ├── FilterCatalogUseCase.js
│       ├── RemoveCartItemUseCase.js
│       ├── RemoveCouponUseCase.js
│       ├── TrackShipmentUseCase.js
│       ├── UnlockVipUseCase.js
│       └── UpdateCartItemQtyUseCase.js
├── adapters/                    # Capa 3: Adaptadores de Interfaz
│   ├── controllers/             # CartController, CatalogController, TrackingController, VipController
│   ├── presenters/              # CurrencyPresenter, ProductPresenter, CartPresenter, TrackingPresenter
│   └── repositories/            # ProductRepository, LocalStorageService
├── infrastructure/              # Capa 4: Frameworks y Drivers
│   ├── dom/
│   │   ├── DomRenderer.js       # Humble Object: manipulación DOM sin lógica de negocio
│   │   ├── MobileDock.js        # Driver del dock móvil flotante
│   │   ├── ScreenTransition.js  # Driver de animación SVG
│   │   ├── ScrollMachine.js     # Driver de scroll y sticky header
│   │   └── TouchGestures.js     # Driver de gestos swipe táctiles
│   └── external/
│       └── GooglePayGateway.js  # Driver simulador de pasarelas de pago
└── container.js                 # Composition Root: Inyección de dependencias
```

---

## 🚀 Despliegue en Cloudflare Pages

El proyecto se despliega de manera nativa sin necesidad de bundlers pesados, aprovechando los módulos estándar ECMAScript (ESM) del navegador:

```bash
# Despliegue directo mediante Wrangler CLI
npx wrangler pages deploy . --project-name=monarcc-store --branch=main --commit-dirty=true
```

---

## 🛠️ Desarrollo Local

Para correr el proyecto localmente sin instalar dependencias:

```bash
# Con Python
python -m http.server 7701 --bind 127.0.0.1

# O con Node.js npx
npx serve . -l 7701
```

Abre en tu navegador: [http://localhost:7701](http://localhost:7701)

---

## 📄 Créditos y Marca

* **Marca:** MONARCC — Tienda de Ropa
* **Ubicación:** Soacha, Cundinamarca, Colombia
* **Instagram:** [@_monarcc_store](https://instagram.com/_monarcc_store)
