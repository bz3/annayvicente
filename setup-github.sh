#!/bin/bash

# Script para crear y subir el repositorio a GitHub

set -e

echo "🚀 Configurando repositorio en GitHub..."

# Verificar si gh está autenticado
if ! gh auth status &>/dev/null; then
    echo "⚠️  Necesitas autenticarte con GitHub primero."
    echo "Ejecutando: gh auth login"
    gh auth login --web
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "index.html" ]; then
    echo "❌ Error: No se encuentra index.html. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# Verificar estado de git
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Todos los cambios están commiteados"
else
    echo "⚠️  Hay cambios sin commitear. Añadiendo y commiteando..."
    git add .
    git commit -m "Update files"
fi

# Crear repositorio en GitHub y hacer push
echo "📦 Creando repositorio 'annayvicente' en GitHub..."
gh repo create annayvicente --public --source=. --remote=origin --push

echo "✅ ¡Listo! El repositorio está en: https://github.com/$(gh api user --jq .login)/annayvicente"
