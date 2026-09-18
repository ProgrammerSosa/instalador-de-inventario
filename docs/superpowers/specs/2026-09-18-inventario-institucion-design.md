# Diseño: Sistema de Inventario (Librería y Limpieza)

**Fecha:** 2026-09-18
**Estado:** Aprobado para pasar a plan de implementación

## Contexto

Aplicación de escritorio 100% local para gestionar el inventario de una institución, dividido en dos áreas: **Librería** y **Limpieza**. Uso principal: una sola PC, sin login (máximo 2 personas de confianza la usan). Uso ocasional secundario: una segunda PC accediendo al mismo inventario por red local, sin instalar nada ahí.

## Alcance

### V1 (este diseño)
- Pantalla de entrada para elegir entre Librería o Limpieza.
- Listado de productos por categoría, con alerta visual cuando el stock está en o bajo el mínimo.
- Alta de productos, edición de datos, registro de entradas/salidas de stock.
- Historial de movimientos con filtros.
- Alertas de stock bajo-mínimo y agotado, con notificación visual (campanita) y por voz (bot local).
- Respaldo manual del archivo de base de datos y exportación a Excel, con recordatorio si hace tiempo que no se hace.
- Instalador `.exe` de Windows, un solo doble clic para instalar y usar.

### Fuera de alcance v1 — backlog fase 2 (se diseña después, por separado)
- **Bot de WhatsApp** para notificar stock bajo a un número fijo con mensajes predeterminados. Diferido porque: requiere una librería no oficial (viola los términos de servicio de WhatsApp, riesgo real de baneo del número), necesita internet activo, y agrega una dependencia pesada (Chromium embebido, ~300MB).
- **Exportación de reportes a PDF** (ej. listado de stock bajo). El usuario confirmó que lo quiere eventualmente, pero se diseña junto con la fase 2 para no atrasar el inventario funcionando.
- **Estadísticas** (consumo por semana/mes/año, producto más consumido, por categoría). Se agrupa con la fase 2 porque es una vista adicional sobre datos que ya van a existir — no bloquea tener el inventario funcionando, y comparte la naturaleza de "capa de valor agregado" con las alertas y el respaldo.

## Arquitectura

**Electron** como shell de escritorio: abre una ventana nativa y, por dentro, levanta un servidor **Express** en `localhost:4000`, escuchando en la red local (no solo `127.0.0.1`) para permitir el acceso ocasional de una segunda PC. Express expone la API REST y sirve el build de **React**. La base **SQLite** vive en la carpeta de datos del usuario (`app.getPath('userData')`), separada de la carpeta de instalación, para persistir entre reinstalaciones/actualizaciones.

- **Uso normal (1 PC):** se instala, se abre el ícono de escritorio, todo local, sin red.
- **Uso ocasional (2 PCs, mismo inventario):** solo se instala en la PC "principal" (la que tiene la base de datos). La segunda PC abre un navegador a `http://<IP-de-la-PC-principal>:4000` en la misma red — sin instalar nada ahí. Limitación inherente: la PC principal debe estar prendida y con la app abierta para que la segunda PC pueda ver datos.

**Detalle importante:** el proceso principal de Electron arranca el servidor Express *en el mismo proceso* (no como un proceso hijo separado), así que `electron/main.js` puede llamar directamente a las funciones del backend (ej. generar el Excel, leer la ruta del archivo `.db`) sin pasar por HTTP. Solo el frontend React (que corre en la ventana, un contexto separado) habla con el backend exclusivamente vía HTTP/fetch.

## Estructura de carpetas

Adaptada de un patrón de proyecto previo del usuario (módulos por dominio con controller/routes/model), quitando lo que no aplica a esta app (sin auth/roles/JWT/invitaciones porque no hay login; sin MongoDB porque SQLite es un solo archivo local, más simple para "doble clic y listo").

```
inventario-app/
├── backend/
│   ├── config/
│   │   └── db.js                    # conexión SQLite + inicialización del schema
│   ├── middlewares/
│   │   └── errorHandler.js          # manejador global de errores
│   ├── utils/
│   │   ├── httpResponses.js         # respuestas estandarizadas { ok, data, error }
│   │   └── constants.js             # categorías, tipos de movimiento
│   ├── src/
│   │   ├── productos/
│   │   │   ├── productos_controller.js
│   │   │   ├── productos_model.js   # queries SQL puras, sin Express
│   │   │   └── productos_routes.js
│   │   ├── movimientos/
│   │   │   ├── movimientos_controller.js
│   │   │   ├── movimientos_model.js
│   │   │   └── movimientos_routes.js
│   │   ├── alertas/
│   │   │   ├── alertas_controller.js
│   │   │   └── alertas_routes.js    # agrega bajo-mínimo + agotado + respaldo pendiente
│   │   └── exportar/
│   │       └── exportar_service.js  # genera el buffer de Excel (productos + movimientos)
│   ├── .env                         # PORT, etc.
│   ├── package.json
│   └── server.js
├── frontend/                        # React (Vite)
│   └── src/
│       ├── components/
│       │   ├── Landing.jsx
│       │   ├── ProductList.jsx
│       │   ├── ProductForm.jsx
│       │   ├── StockMovementForm.jsx
│       │   ├── Historial.jsx
│       │   ├── NotificationBell.jsx
│       │   ├── AlertBot.jsx
│       │   └── BackupExportButtons.jsx
│       ├── api/client.js
│       └── App.jsx
├── electron/                        # wrapper fino: arranca backend + abre ventana
│   ├── main.js
│   ├── preload.js
│   └── ipc/
│       └── respaldo.js              # diálogos nativos + copiar .db + guardar Excel
└── package.json                     # config de electron-builder
```

Este patrón (una carpeta por dominio dentro de `src/`) escala bien para la fase 2: el bot de WhatsApp y la exportación a PDF entrarían como carpetas nuevas (`whatsapp/`, `exports/`) sin tocar lo existente.

## Esquema de base de datos (SQLite)

**`productos`**

| campo | tipo | notas |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| nombre | TEXT NOT NULL | |
| categoria | TEXT NOT NULL | CHECK IN ('Librería','Limpieza') |
| stock_actual | INTEGER NOT NULL DEFAULT 0 | |
| stock_minimo | INTEGER NOT NULL DEFAULT 0 | |
| unidad | TEXT DEFAULT 'unidad' | ej. unidad, caja, litro |
| icono | TEXT DEFAULT 'Package' | nombre de ícono de `lucide-react`, elegido al cargar el producto (no emoji — se ve más profesional) |
| created_at | DATETIME DEFAULT (datetime('now','localtime')) | hora local, no UTC |
| updated_at | DATETIME DEFAULT (datetime('now','localtime')) | hora local, no UTC |

**`movimientos`**

| campo | tipo | notas |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| producto_id | INTEGER NOT NULL | FK → productos(id) |
| tipo | TEXT NOT NULL | CHECK IN ('entrada','salida') |
| cantidad | INTEGER NOT NULL | > 0 |
| fecha | DATETIME DEFAULT (datetime('now','localtime')) | hora local, no UTC |
| nota | TEXT | opcional, ej. "compra proveedor X" |

**`app_config`** (clave/valor simple, para ajustes chicos como la fecha del último respaldo)

| campo | tipo | notas |
|---|---|---|
| clave | TEXT PK | ej. 'ultimo_respaldo_fecha' |
| valor | TEXT | |

**Regla de integridad:** cada movimiento actualiza `productos.stock_actual` en la misma transacción en que se inserta en `movimientos`, para que nunca queden desincronizados. Una salida que dejaría el stock en negativo se rechaza con error 400.

## Endpoints de la API

- `GET /api/productos?categoria=` — listar productos (filtro opcional por categoría)
- `GET /api/productos/bajo-stock?categoria=` — productos en o bajo su stock mínimo
- `POST /api/productos` — crear producto
- `PUT /api/productos/:id` — editar nombre / stock_minimo / unidad
- `POST /api/productos/:id/movimiento` — registrar entrada o salida (actualiza stock_actual)
- `DELETE /api/productos/:id` — eliminar producto (solo si no tiene movimientos registrados; si tiene historial, error 400 — así no se pierde el registro de qué pasó con ese producto)
- `GET /api/movimientos?producto_id=&categoria=&desde=&hasta=` — historial con filtros
- `GET /api/alertas` — lista unificada de alertas activas (bajo-mínimo, agotado, respaldo pendiente), consumida por la campanita y el bot de voz

## Frontend

### Flujo de pantallas

1. **Splash** (`/`): logo de la app centrado, nombre, botón "Ingresar". Pantalla de bienvenida simple, sin datos ni llamadas a la API — solo transición.
2. **Selección de categoría** (`/categorias`): 2 tarjetas grandes, "Librería" y "Limpieza", cada una con un indicador si hay productos bajo mínimo en esa categoría (llamada liviana a `GET /api/productos/bajo-stock?categoria=`).
3. **Vista de categoría** (`/libreria`, `/limpieza`): el diseño de grilla de tarjetas con ícono por producto (según los mockups del usuario) en vez de una tabla plana — cada tarjeta muestra nombre + ícono, resaltada en rojo si está bajo mínimo o agotada. Casilleros vacíos con "+" para agregar un producto nuevo directo desde el grid. Cada categoría conserva su propia ambientación visual (fondo/temática ilustrada), distinta entre Librería y Limpieza. Barra superior con navegación a Dashboard y Settings (ver más abajo) y la campanita de notificaciones.
4. **Historial** (`/libreria/historial`, `/limpieza/historial`): listado de movimientos con filtros por fecha, dentro de la misma categoría.

### Modo Edición vs. Modo Normal

Dentro de la vista de categoría hay un interruptor de modo, visible en todo momento (ej. franja de color en la parte superior indicando en qué modo se está):

- **Modo Normal (default):** el uso del día a día. Tocar una tarjeta de producto abre el registro de una **salida** — descuenta stock, y pide una **nota obligatoria** (para qué/a quién se entregó), que queda en el Historial.
- **Modo Edición:** hay que activarlo explícitamente. Habilita dar de alta productos nuevos (casilleros "+"), registrar **entradas** de stock, y editar nombre/mínimo/unidad de un producto existente.
- Por seguridad ante errores: si se cambia de categoría o pasa un tiempo sin actividad, vuelve solo a Modo Normal — así nadie deja la app "en edición" sin querer.

### Paleta y estilo

- Colores principales de la interfaz (barras, botones, estructura): **blanco** (base), **azul** (acciones primarias, Modo Normal), **rojo** (alertas, stock bajo/agotado, y como acento del Modo Edición activo para que se note que se puede modificar algo).
- Cada categoría mantiene su propia temática ilustrada (fondos, íconos) dentro de esa paleta base — no se pierde la identidad visual de cada inventario.
- React + Tailwind + iconos temáticos por producto/categoría.

### Componentes

- **Splash**, **CategoriaSelector**, **ProductGrid** (grilla con tarjetas + modo), **ProductForm** (modal de alta/edición, solo Modo Edición), **StockMovementForm** (modal de entrada — Edición — o salida con nota obligatoria — Normal), **Historial**, **ModeToggle**.
- **NotificationBell**: ícono en la barra superior con contador de alertas activas; al hacer clic despliega el panel con el detalle de cada una.
- **AlertBot**: mascota chica con globo de texto que muestra y lee en voz alta la alerta más urgente.
- **BackupExportButtons**: dentro de Settings — botones "Exportar Respaldo" y "Exportar a Excel".
- **Dashboard** (fase 2, junto con Estadísticas): vista de resumen dentro de cada categoría — consumo por semana/mes/año y producto más consumido, calculado en el frontend a partir de `GET /api/movimientos` con filtros de fecha (ya soportado), sin necesidad de un endpoint nuevo.
- **Settings**: acceso a Exportar Respaldo / Exportar a Excel (y, a futuro, configuración del bot de WhatsApp).

## Alertas y notificaciones

Mecanismo único para todo tipo de alerta (stock y respaldo): la campanita muestra un contador y un panel con el detalle; el bot muestra el mensaje más urgente en un globo de texto y lo lee en voz alta con la síntesis de voz nativa del navegador/Electron (Web Speech API) — 100% local, no depende de internet ni de ningún servicio externo. Se dispara al abrir la app y después de cada movimiento de stock o respaldo.

**Tipos de alerta en v1:** bajo mínimo, agotado, respaldo pendiente. (Vencimiento y "sin movimiento reciente" quedan fuera de v1 — se pueden sumar después sin romper nada, ver Alcance.)

**Contenido del mensaje:** siempre incluye el nombre del producto, cuánto stock queda, y un llamado a la acción para reponerlo. Ejemplos:
- Bajo mínimo: *"Atención: quedan 3 unidades de Papel A4, está bajo el mínimo. Hay que reponer stock."*
- Agotado: *"Atención: Detergente está agotado, no queda stock. Hay que reponerlo con urgencia."*
- Respaldo pendiente: *"Hace 8 días que no hacés un respaldo del inventario."*

## Respaldo y exportación

- **Exportar Respaldo:** botón que abre el diálogo nativo de Windows para elegir una carpeta (ej. un pendrive) y copia ahí el archivo `.db` completo, con nombre y fecha (`inventario-respaldo-2026-09-18.db`). Es el respaldo real: alcanza para restaurar todo el inventario tal cual estaba. Actualiza `app_config.ultimo_respaldo_fecha`.
- **Exportar a Excel:** mismo diálogo de carpeta, genera un `.xlsx` (vía `exceljs`) con dos hojas — productos con su stock actual, e historial de movimientos. No sirve para restaurar la app (es una foto legible de los datos en ese momento), pero es útil para revisar, imprimir o compartir.
- **Recordatorio:** si pasaron más de 7 días desde el último respaldo (o nunca se hizo), aparece como una alerta más en `GET /api/alertas`.
- Ambas exportaciones se resuelven en `electron/main.js` vía IPC desde los botones de React, reutilizando directamente las funciones del backend (sin pasar por HTTP, como se explicó en Arquitectura).

## Manejo de errores

Middleware central de errores en Express → respuestas `{ ok: false, error: "mensaje" }` (éxito: `{ ok: true, data }`) con status HTTP correcto (400 validación, 404 no encontrado, 500 inesperado). Rutas no encontradas también devuelven ese mismo formato (404 con `error: "Ruta no encontrada"`), nunca el HTML por default de Express. El frontend muestra esos mensajes inline y deshabilita botones mientras hay una request en curso.

## Testing

Sin suite completa (app interna de 2 usuarios): verificación manual de cada flujo en la app corriendo. Tests automatizados acotados a la lógica de actualización de stock (sumar/restar correctamente, bloquear stock negativo), que es donde un bug real arruina los datos.

## Empaquetado

`electron-builder` con target `nsis`: un instalador `InventarioInstitucion-Setup-1.0.0.exe` con wizard, accesos directos en escritorio y menú inicio, desinstalador incluido. Se copia ese archivo a la segunda PC solo si se va a usar como principal alternativa (no en el modo "ver el mismo inventario por red", donde no se instala nada ahí).

## Flujo de trabajo

Se trabaja con ramas de git para organizar los cambios de implementación. El commit y el push quedan a cargo del usuario en todo momento.
