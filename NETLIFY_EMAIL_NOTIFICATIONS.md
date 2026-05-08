Configura estas variables en Netlify para activar los correos automáticos de cotizaciones:

- `RESEND_API_KEY`
- `QUOTE_NOTIFY_FROM`
- `QUOTE_NOTIFY_TO`
- `QUOTE_NOTIFY_REPLY_TO` opcional

Ejemplo:

- `RESEND_API_KEY=re_xxxxx`
- `QUOTE_NOTIFY_FROM=Mohicano <notificaciones@tudominio.cl>`
- `QUOTE_NOTIFY_TO=vendedor1@tudominio.cl,vendedor2@tudominio.cl`
- `QUOTE_NOTIFY_REPLY_TO=ventas@tudominio.cl`

Notas:

- La cotización se guarda aunque el correo falle.
- `QUOTE_NOTIFY_TO` acepta varios correos separados por coma.
- El proveedor usado es Resend.
