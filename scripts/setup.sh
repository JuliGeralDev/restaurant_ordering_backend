#!/bin/bash

# Quick Setup Script for Restaurant Ordering API
# Para Linux/Mac

echo "🚀 Configurando Restaurant Ordering API..."
echo ""

# Verificar Node.js
echo "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js instalado: $NODE_VERSION"
else
    echo "✗ Node.js no está instalado. Descarga desde: https://nodejs.org"
    exit 1
fi

# Verificar Docker
echo "Verificando Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✓ Docker instalado: $DOCKER_VERSION"
else
    echo "✗ Docker no está instalado. Descarga desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar AWS CLI
echo "Verificando AWS CLI..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    echo "✓ AWS CLI instalado: $AWS_VERSION"
else
    echo "✗ AWS CLI no está instalado. Descarga desde: https://aws.amazon.com/cli/"
    exit 1
fi

echo ""
echo "Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "✗ Error instalando dependencias"
    exit 1
fi

echo "✓ Dependencias instaladas"
echo ""

echo "Iniciando DynamoDB Local..."
npm run docker:up

if [ $? -ne 0 ]; then
    echo "✗ Error iniciando DynamoDB"
    exit 1
fi

echo "✓ DynamoDB iniciado"
echo ""

echo "Esperando a que DynamoDB esté listo..."
sleep 3

echo "Inicializando base de datos y datos de muestra..."
npm run init:db

if [ $? -ne 0 ]; then
    echo "✗ Error inicializando base de datos"
    exit 1
fi

echo ""
echo "✅ ¡Configuración completada exitosamente!"
echo ""
echo "Para iniciar el servidor de desarrollo:"
echo "  npm run dev"
echo ""
echo "El servidor estará disponible en:"
echo "  http://localhost:3000"
echo ""
