# Mohicano Jeans — Contexto técnico del proyecto

## Stack
- Frontend estático: HTML + JS vanilla (`cole-43.html`, `cole-44.html`, `script-v2.js`)
- Backend: Supabase (PostgreSQL + PostgREST + RLS)
- Deploy: Netlify (push a `origin/main` → auto-deploy)
- Excel: librería `xlsx-populate` (browser), plantillas `.xlsx` en la raíz

## Archivos clave
- `script-v2.js` — lógica principal: catálogo, carrito, pedidos, descarga Excel
- `cole-43.html` — catálogo Cole 43
- `cole-44.html` — catálogo Cole 44
- `PLANILLA 43 LISTA PRECIO FINAL.xlsx` — template Excel pedidos Cole 43
- `PLANILLA 44 LISTA PRECIO FINAL.xlsx` — template Excel pedidos Cole 44

## Sistema de pedidos / Excel

### Configs de plantilla (`ORDER_TEMPLATE_CONFIGS` en script-v2.js ~línea 4260)
| Config key | Archivo | skuColumn | skuFormatter |
|---|---|---|---|
| `unified` | PLANILLA 43 | B | — (convierte a Number si todo dígitos) |
| `catalogo-43` | PLANILLA 43 | B | `numeric43` |
| `catalogo-44` | PLANILLA 44 | B | `numeric43` |
| `default` | plantilla-toma-pedidos.xlsx | A | — |

- `skuFormatter: "numeric43"` → SKU se convierte a 6 dígitos sin guión: `4301-00` → `430100` (escrito como **número**, no texto)
- `obtenerValorSkuCeldaPlantilla()` convierte a `Number` si config es `unified` O tiene `skuFormatter === "numeric43"`

### Hoja "TOMA DE PEDIDOS" — columnas clave
- **A**: barra (código de barras scanner) — se limpia
- **B**: código SKU (6 dígitos numérico) — script escribe aquí
- **C**: ARTÍCULO — fórmula `=IF(A<>"",VLOOKUP(A,jeans,3),VLOOKUP(B,jeans2,2))`
- **D**: TIRO — fórmula similar
- **E**: CORTE — fórmula similar
- **F–P**: tallas 36–50, S, M, L
- **S**: VALOR — fórmula VLOOKUP precio
- **T**: TOTAL = Q*S
- Filas artículos: 15–59 (aprox)

### Named ranges en PLANILLA 43 y 44
- `jeans` = `'BD jeans Dama'!$A$1:$F$1424` (lookup por código de barras en col A)
- `jeans2` = `'BD jeans Dama'!$B$1:$I$436` (lookup por código 6 dígitos en col B) — **los códigos en col B son NÚMEROS**

### Formato de códigos en BD jeans Dama
Todos los códigos en col B del BD deben estar en formato **6 dígitos numérico** (ej: `440100`, `441401`).
La conversión es: `4401` → `440100` (×100), `4414-00` → `441400` (quitar guión), `441700` → `441700` (igual).
Si se agrega un artículo nuevo a la PLANILLA 44 o 43, normalizar el código en col B antes de guardar.
Script de normalización disponible en el historial de commits (commit `6eaf48d`).

### Celdas de encabezado cliente (PLANILLA 43 y 44)
| Celda | Campo | Config key |
|---|---|---|
| L1 | Razón Social | `razonSocialCell` |
| L2 | Giro | `giroCell` |
| L3 | Dirección | `direccionCell` |
| L4 | Nombre Tienda | `nombreTiendaCell` |
| L5 | RUT | `rutCell` |
| L6 | Comuna | `comunaCell` |
| L7 | Teléfono | `phoneCell` |
| L8 | Fecha | `dateCell` |
| E7 | Transporte | `transporteCell` |
| U1/V1 | ID/COT-XXXX | `idLabelCell`/`idValueCell` |

Estas celdas tienen **fórmulas VLOOKUP** que buscan el RUT (L5) en `BASE DE DATOS OFICIAL`. Si el cliente existe en BD → auto-rellena. Si no → "SIN INFORMACIÓN".

### setCelda (función en generarExcelPlantillaQuoteAdmin)
Reemplaza la fórmula VLOOKUP con un literal de Supabase:
```js
c.formula(`"${String(value).replace(/"/g, '""')}"`)
```
Solo escribe si `value != null && value !== ""`. Si Supabase no tiene el dato (pedido antiguo), deja la fórmula VLOOKUP intacta.

### BASE DE DATOS OFICIAL — columnas
| Col | Campo |
|---|---|
| A | RUT (con formato ej: 13.744.036-9) |
| B | RUT solo dígitos |
| C | Razón Social |
| E | Dirección |
| F | Teléfono |
| N | Transporte |
| S | Giro |
| T | Nombre Tienda |
| U | Comuna |

Filas de datos: 4–400 (los VLOOKUP de L1–L7/E7 usan `$A$4:$AC$400`; hasta 2026-09-04 era 166 y estaba lleno). El script agrega el cliente en la primera fila con A vacía si no existe (para que VLOOKUP funcione en futuras descargas).

## Supabase

### Tabla `quotes`
Campos relevantes guardados: `client_rut`, `client_phone`, `store_name`, `giro`, `direccion`, `nombre_tienda`, `comuna`, `transporte`, `source`

### RPC `create_quote_with_stock_reservation`
Usado para pedidos Cole 43 (con reserva de stock). Acepta `p_quote` JSONB con todos los campos incluyendo giro/dirección/etc.

### `enviarPayloadDirectoSinStock`
Usado para pedidos Cole 44 (sin reserva de stock). Hace POST directo a `/rest/v1/quotes` con `payload.quote` completo.

### Acceso a pedidos
RLS activo — el `anon key` NO puede leer `quotes` (retorna array vacío, no 403). Se necesita JWT de sesión (vendedor autenticado).

## Flujo de descarga Excel (admin)
1. `cargarCotizacionAdminPorId(quoteId)` — carga quote + items de Supabase
2. `obtenerConfigPlantillaPedido(quote, items)` — determina qué template usar según `quote.source`
3. `generarExcelPlantillaQuoteAdmin(quote, items)` — llena el template con datos
4. Descarga el `.xlsx` resultante

## Deploy
- `git push origin main` → Netlify despliega automáticamente
- Terminar siempre los mensajes de push con `main@<hash>`

---

# Decisiones de Manu (reglas fijas)

Esto NO se vuelve a preguntar. Si una regla acá contradice lo que vas a hacer, gana la regla.
Antes de tocar el guion de Sofía, la página o el catálogo, leer esta sección completa.

## Cómo trabajar
- **Todo en local primero.** Push solo cuando Manu dice "sube". Aprobar un push no aprueba el siguiente.
- Terminar cada mensaje de push con `main@<hash>`.
- Responder en **español chileno con tuteo**. Nunca voseo argentino, nunca inglés.
- **Respuestas cortas**: lo justo y necesario.
- **Nada de Nexor se sube al repo** (`NEXOR IA/` está excluido). El repo es PÚBLICO: nunca commitear RUT, teléfonos, correos ni nombres de clientes.
- **Nunca** guardar claves en el repo ni pegarlas en el chat.
- `Z:\BI` y el servidor del ERP son **solo lectura**.
- El reporte de pendientes es **privado**: no va a la web.
- Revisar las conversaciones de Sofía **por iniciativa propia** y proponer mejoras. Lo que un cliente pide y ella no puede hacer, ESO es el backlog.

## Precios
- Todos los precios de lista son **netos**. El IVA (19%) se suma **una sola vez sobre el neto total**, nunca por unidad ni por modelo.
- En los textos va "+ IVA", nunca "c/u + IVA".

## Cómo muestra Sofía los modelos
- **Manda IMÁGENES, no links.** El handle de la biblioteca de Nexor es **arroba + código exacto**: `@4222-00`, `@4234-04`.
- El link `/m/CODIGO` **solo** si el cliente lo pide con todas sus letras, o si ese modelo no tiene imagen.
- Al mostrar modelos va **código y precio**, nada más. **Sin stock, sin tallas, sin disponibilidad.** El stock se entrega DESPUÉS, solo si el cliente pregunta por uno.
- El pie de foto de Nexor **no se puede usar** (la imagen sale con el contenido vacío): el código y el precio van en el mensaje siguiente, pegado, y tiene que corresponder a esa foto.
- Varios modelos = varias fotos, **una tras otra, sin preguntar entre medio**.
- **Si un modelo tiene foto en la página, debe tener su imagen en Nexor.** Hoy no se puede verificar: la biblioteca no tiene API (pendiente con Nexor).

## Cómo vende
- **Ningún link va solo.** Siempre con una frase que diga qué es y qué hacer con él. Un link pelado deja al cliente sin saber para qué sirve.
- **Preguntar por el stock es interés**: se entrega el stock Y enseguida se ofrecen las dos formas, nombrando el modelo.
- Después de mandar una foto y su línea de código y precio, **no se manda nada más**: ni link, ni ficha, ni stock. El cliente pide si quiere más.
- Apenas el cliente muestre **interés** en un modelo (no hace falta que diga "lo quiero"), ofrecerle las dos formas nombrando el modelo: *"¿te mando el link con el 4222 ya cargado, o lo armamos juntos?"*.
- **Saludar y responder en el mismo turno.** Prohibido gastar un turno solo en saludar.
- **Nunca inventar.** Color sin nombre en `colores.json` → no se nombra. No decir que mandó fotos que no mandó.
- Mínimo 24 unidades por pedido; 12 por modelo solo en la Dolce Vita 44.

## Llamadas (separado de WhatsApp)
- Voz Catalina (chilena). Por teléfono **no se muestra nada**: se describe de oído y se manda por WhatsApp al colgar.
- Prohibido decir "te muestro" o dictar un link por teléfono.
- **Nunca prometer devolver la llamada.**
- SMS **apagado** en el número: rompía los links.

## Formulario de pedido
- **Giro y nombre de tienda son opcionales.** Obligatorios para despachar: razón social, teléfono, dirección, comuna y transporte.
- La meta es que el mayorista **no escriba ningún dato**: solo apretar Enviar.

## Códigos de color
- Los dos dígitos finales son el color (`4440-01` → color `01`), pero **NO es una tabla global**: el `00` y el `01` varían por modelo.
- Nombres confirmados desde las carpetas de fotos: `04` café, `06` beige, `08` ocre, `16` verde oliva, `38` ostra, `48` burdeo.
- El resto los dicta Manu. Mientras no tengan nombre, se muestra el código y **no se inventa**.
