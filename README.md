# Anna & Vicente — Wedding Website

Web de boda premium con diseño editorial minimalista, multiidioma (ES/EN/HU) y RSVP integrado con Netlify Forms.

## Estructura de archivos

```
/
├── index.html
├── assets/
│   ├── styles.css
│   └── app.js
├── data/
│   └── content.json
├── netlify.toml
└── README.md
```

## Deploy en Netlify

### Opción 1: Deploy desde GitHub/GitLab/Bitbucket

1. **Preparar el repositorio**
   - Sube todos los archivos a un repositorio Git
   - Asegúrate de que `index.html` esté en la raíz

2. **Conectar con Netlify**
   - Ve a [app.netlify.com](https://app.netlify.com)
   - Click en "Add new site" → "Import an existing project"
   - Conecta tu repositorio
   - Netlify detectará automáticamente la configuración

3. **Configuración del build** (si es necesario)
   - Build command: (dejar vacío, no hay build)
   - Publish directory: `/` (raíz)

4. **Deploy**
   - Click en "Deploy site"
   - Espera a que termine el deploy
   - Tu sitio estará disponible en `https://tu-sitio.netlify.app`

### Opción 2: Deploy manual (drag & drop)

1. **Preparar archivos**
   - Asegúrate de tener todos los archivos en la estructura correcta

2. **Subir a Netlify**
   - Ve a [app.netlify.com](https://app.netlify.com)
   - Click en "Add new site" → "Deploy manually"
   - Arrastra la carpeta del proyecto a la zona de drop
   - Netlify subirá y desplegará automáticamente

### Configuración de Netlify Forms

1. **Verificar el formulario**
   - El formulario RSVP ya está configurado con:
     - `name="rsvp"`
     - `data-netlify="true"`
     - `method="POST"`
     - Campo honeypot anti-spam

2. **Ver las submissions**
   - Ve a tu sitio en Netlify Dashboard
   - Navega a "Forms" en el menú lateral
   - Click en "rsvp" para ver todas las respuestas
   - Puedes ver, filtrar y exportar las respuestas

3. **Exportar a Excel/CSV**
   - En la sección "Forms" → "rsvp"
   - Click en "Export entries"
   - Selecciona formato CSV o descarga directa
   - El CSV incluirá todas las columnas: timestamp, firstName, lastName, email, attendance, mainCourse, allergies, comments

4. **Notificaciones por email** (opcional)
   - En "Forms" → "rsvp" → "Settings" → "Form notifications"
   - Configura notificaciones por email cuando llegue una nueva submission

### Configuración adicional recomendada

1. **Dominio personalizado**
   - En "Domain settings" → "Add custom domain"
   - Sigue las instrucciones para configurar tu dominio

2. **HTTPS**
   - Netlify proporciona HTTPS automático con Let's Encrypt
   - Se activa automáticamente al configurar el dominio

3. **Variables de entorno** (si las necesitas en el futuro)
   - En "Site settings" → "Environment variables"
   - Añade variables si necesitas configuraciones específicas

## Completar el contenido

Antes del deploy, completa los campos marcados con `TODO:` en `/data/content.json`:

- **Dirección completa** del venue
- **Indicaciones de cómo llegar**
- **URL del mapa** (Google Maps embebido)
- **URLs de hoteles** y distancias
- **Información de transporte** desde Madrid
- **Información de parking**
- **Dress code**
- **URL de imagen Open Graph** (opcional pero recomendado)

## Estructura de datos del RSVP

Las respuestas del formulario incluyen:

- `timestamp`: Fecha y hora de envío (automático)
- `firstName`: Nombre
- `lastName`: Apellidos
- `email`: Email
- `attendance`: "yes" o "no"
- `mainCourse`: "meat", "fish" o vacío (solo si attendance = "yes")
- `allergies`: Texto libre (solo si attendance = "yes")
- `comments`: Texto libre (opcional)

## Testing local

Para probar localmente antes del deploy:

1. **Servidor local simple**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # O con Node.js (http-server)
   npx http-server -p 8000
   ```

2. **Nota sobre Netlify Forms en local**
   - Netlify Forms solo funciona en producción
   - Para testing local, puedes usar el modo "preview" de Netlify o testear directamente en el deploy

## Características

- ✅ Multiidioma (ES/EN/HU) con detección automática
- ✅ Contador regresivo hasta el evento
- ✅ RSVP con validación front-end
- ✅ Netlify Forms integrado
- ✅ Diseño responsive mobile-first
- ✅ Accesibilidad (WCAG)
- ✅ Performance optimizado
- ✅ SEO básico con meta tags

## Soporte

Para problemas o dudas sobre el deploy, consulta la [documentación de Netlify](https://docs.netlify.com/).
