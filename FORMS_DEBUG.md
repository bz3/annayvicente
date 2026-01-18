# Guía de Depuración del Formulario RSVP

## Cambios Realizados

1. **Corregido atributo del formulario**: Cambiado `netlify-honeypot` a `data-netlify-honeypot`
2. **Añadido `action="/"`** al formulario para asegurar que Netlify procese correctamente
3. **Mejorado el manejo de errores** con logging detallado en consola
4. **Limpieza de campos condicionales** cuando attendance = "no"
5. **Creado `forms.html`** para ayudar a Netlify a detectar el formulario durante el build

## Cómo Verificar que Funciona

### 1. Probar el Formulario

1. Ve a https://annayvicente.netlify.app
2. Llena el formulario RSVP con datos de prueba
3. Abre la consola del navegador (F12 → Console)
4. Envía el formulario
5. Revisa los mensajes en la consola para ver si hay errores

### 2. Ver las Submissions en Netlify

1. Ve a https://app.netlify.com/projects/annayvicente
2. Click en **"Forms"** en el menú lateral
3. Click en **"rsvp"** para ver todas las respuestas
4. Deberías ver todas las submissions con:
   - Timestamp
   - firstName
   - lastName
   - email
   - attendance
   - mainCourse (si attendance = "yes")
   - allergies (si attendance = "yes")
   - comments

### 3. Exportar a Excel/CSV

1. En la sección Forms → rsvp
2. Click en **"Export entries"**
3. Selecciona formato CSV
4. Descarga el archivo y ábrelo en Excel

## Si el Formulario Sigue Fallando

### Verificar en la Consola del Navegador

Abre la consola (F12) y busca errores. Los mensajes de error ahora incluyen:
- Status code de la respuesta
- Status text
- Preview de la respuesta del servidor

### Verificar en Netlify Dashboard

1. Ve a https://app.netlify.com/projects/annayvicente/deploys
2. Revisa los logs del último deploy
3. Busca mensajes relacionados con "Forms" o "rsvp"

### Verificar que Netlify Detectó el Formulario

1. Ve a https://app.netlify.com/projects/annayvicente/forms
2. Deberías ver un formulario llamado "rsvp"
3. Si no aparece, Netlify no lo detectó durante el build

### Solución Alternativa: Usar Formulario HTML Directo

Si el AJAX sigue fallando, puedes hacer que el formulario se envíe directamente sin JavaScript:

1. Quita el `e.preventDefault()` en `handleFormSubmit`
2. El formulario se enviará normalmente y Netlify mostrará su página de éxito por defecto

## Estructura de Datos Esperada

Cada submission debería tener:

```json
{
  "form-name": "rsvp",
  "firstName": "Nombre",
  "lastName": "Apellidos",
  "email": "email@ejemplo.com",
  "attendance": "yes" | "no",
  "mainCourse": "meat" | "fish" | "" (solo si attendance = "yes"),
  "allergies": "texto" | "" (solo si attendance = "yes"),
  "comments": "texto" | ""
}
```

## Notificaciones por Email (Opcional)

Para recibir emails cuando llegue una nueva submission:

1. Ve a Forms → rsvp → Settings
2. Click en "Form notifications"
3. Añade tu email
4. Guarda los cambios
