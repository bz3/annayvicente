# Instrucciones para subir a GitHub

## Paso 1: Crear el repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `annayvicente`
3. Elige si quieres que sea público o privado
4. **NO marques** "Initialize with README" (ya tenemos archivos)
5. Click en "Create repository"

## Paso 2: Subir el código

Una vez creado el repositorio, ejecuta estos comandos en la terminal:

```bash
cd /Users/cx02158/boda

# Verificar que el remote esté configurado
git remote -v

# Si necesitas cambiar el remote (reemplaza TU_USUARIO con tu username de GitHub):
git remote set-url origin https://github.com/TU_USUARIO/annayvicente.git

# O si prefieres usar SSH:
git remote set-url origin git@github.com:TU_USUARIO/annayvicente.git

# Hacer push
git push -u origin main
```

## Autenticación

Si te pide credenciales:

### Opción A: Personal Access Token (recomendado)
1. Ve a https://github.com/settings/tokens
2. Click en "Generate new token (classic)"
3. Selecciona el scope `repo`
4. Copia el token
5. Cuando git pida password, pega el token

### Opción B: SSH
1. Genera una clave SSH si no tienes: `ssh-keygen -t ed25519 -C "tu@email.com"`
2. Añade la clave a GitHub: https://github.com/settings/keys
3. Usa el remote SSH: `git@github.com:TU_USUARIO/annayvicente.git`

## Verificar

Una vez subido, verifica en:
https://github.com/TU_USUARIO/annayvicente
