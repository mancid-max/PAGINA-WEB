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
