# Quick Setup Script for Restaurant Ordering API
# Para Windows PowerShell

Write-Host "🚀 Configurando Restaurant Ordering API..." -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no está instalado. Descarga desde: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar Docker
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no está instalado. Descarga desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Verificar AWS CLI
Write-Host "Verificando AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI instalado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI no está instalado. Descarga desde: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

Write-Host "Iniciando DynamoDB Local..." -ForegroundColor Yellow
npm run docker:up

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error iniciando DynamoDB" -ForegroundColor Red
    exit 1
}

Write-Host "✓ DynamoDB iniciado" -ForegroundColor Green
Write-Host ""

Write-Host "Esperando a que DynamoDB esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Inicializando base de datos y datos de muestra..." -ForegroundColor Yellow
npm run init:db

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error inicializando base de datos" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ ¡Configuración completada exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el servidor de desarrollo:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "El servidor estará disponible en:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""
