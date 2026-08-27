# Web Eventos

Landing page de una sola pantalla (one scroll) para una consultora de eventos y
alquiler de mobiliario. HTML, CSS y JavaScript sin dependencias ni build.

## Estructura

```
index.html          Todas las secciones
css/styles.css      Estilos
js/main.js          Slider del hero, acordeón de proyectos y visor de galería
assets/img/         Fotos en WebP
  hero/             Fondo del banner (1600px y 900px)
  servicios/        Portadas verticales de las cards del hero
  sm/               Versiones de 800px para galerías en pantallas pequeñas
  extra/            Fotos convertidas, sin usar todavía
serve.py            Servidor de desarrollo (envía no-cache)
```

## Secciones

1. **Hero** — foto de fondo, título a la derecha y slider de servicios a la
   izquierda. Al hacer clic en una card se expande, se convierte en galería y
   el texto de la derecha cambia por la descripción de ese servicio. Botón de
   pantalla completa para ver la galería en grande.
2. **Franja** — separador sólido con una frase.
3. **Proyectos** — hover cambia la foto de fondo en escritorio; en pantallas
   pequeñas es un acordeón. Cada proyecto tiene un slideshow automático.
4. **Contacto** — correo y teléfono.
5. **Footer**.

## Desarrollo

```bash
python3 serve.py        # http://localhost:4321
```

El servidor manda cabeceras `no-cache`; los enlaces a CSS y JS llevan además un
parámetro `?v=` que hay que subir al cambiarlos, para evitar caché en el
navegador.

## Despliegue

Worker de Cloudflare con assets estáticos. La configuración vive en
`wrangler.jsonc` y `.assetsignore` marca los archivos que no se publican.

```bash
npx wrangler login
npx wrangler deploy
```

## Pendiente

- Los textos de marca siguen en lorem ipsum
- Las secciones `#about` y `#approach` del menú aún no existen
- El teléfono no lleva código de país
