<#
.SYNOPSIS
  Genera el .env de Docker Compose a partir de los contenedores creados con "docker run"
  (mediflow-mysql, mediflow-backend y mediflow-fastapi), para pasar a Compose sin perder la base de datos.

.DESCRIPTION
  Copia credenciales, nombre de la base, volumen de MySQL y carpeta de OCI. Nunca muestra los valores.
  El .env queda en la raíz del repositorio y está en .gitignore.

  Uso (desde la raíz del repositorio):
    .\scripts\generar-env-desde-contenedores.ps1
    docker stop mediflow-backend mediflow-fastapi mediflow-mysql
    docker compose up -d --build
#>
param(
    [string]$Salida = (Join-Path (Split-Path $PSScriptRoot -Parent) '.env'),
    [switch]$Sobrescribir
)

$ErrorActionPreference = 'Stop'

if ((Test-Path $Salida) -and -not $Sobrescribir) {
    Write-Error "Ya existe $Salida. Usa -Sobrescribir para reemplazarlo."
}

function Leer-Entorno([string]$contenedor) {
    $variables = @{}
    $lineas = docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' $contenedor 2>$null
    if ($LASTEXITCODE -ne 0) { throw "No existe el contenedor $contenedor" }
    foreach ($linea in $lineas) {
        $i = $linea.IndexOf('=')
        if ($i -gt 0) { $variables[$linea.Substring(0, $i)] = $linea.Substring($i + 1) }
    }
    return $variables
}

function Montaje([string]$contenedor, [string]$destino) {
    $json = docker inspect -f '{{json .Mounts}}' $contenedor | ConvertFrom-Json
    return $json | Where-Object { $_.Destination -eq $destino } | Select-Object -First 1
}

# Valor seguro para .env de Compose: comillas simples (literal), o dobles si el valor trae comillas simples.
function Valor([string]$v) {
    if ($null -eq $v) { return "''" }
    if ($v -notmatch "'") { return "'$v'" }
    return '"' + ($v -replace '\\', '\\' -replace '"', '\"' -replace '\$', '$$$$') + '"'
}

$backend = Leer-Entorno 'mediflow-backend'
$mysql = Leer-Entorno 'mediflow-mysql'
$fastapi = Leer-Entorno 'mediflow-fastapi'

$baseDatos = if ($backend['DB_URL'] -match 'jdbc:mysql://[^/]+/([^?]+)') { $Matches[1] } else { $mysql['MYSQL_DATABASE'] }
$volumen = (Montaje 'mediflow-mysql' '/var/lib/mysql').Name
$oci = Montaje 'mediflow-fastapi' '/run/oci'

$lineas = @(
    '# Generado por scripts/generar-env-desde-contenedores.ps1. No subir a Git.',
    "MYSQL_DATABASE=$(Valor $baseDatos)",
    "DB_USER=$(Valor $backend['DB_USER'])",
    "DB_PASSWORD=$(Valor $backend['DB_PASSWORD'])",
    "MYSQL_ROOT_PASSWORD=$(Valor $mysql['MYSQL_ROOT_PASSWORD'])",
    "MYSQL_VOLUME=$(Valor $volumen)",
    "JWT_SECRET=$(Valor $backend['JWT_SECRET'])",
    'MEDIFLOW_ADMIN_USER=',
    'MEDIFLOW_ADMIN_PASSWORD=',
    "GEMINI_API_KEY=$(Valor $fastapi['GEMINI_API_KEY'])",
    'GEMINI_MODEL=gemini-3.8-flash',
    "OCI_PROFILE=$(Valor $fastapi['OCI_PROFILE'])",
    'ALERTA_WEBHOOK_URL=',
    'ALERTA_INCLUIR_PACIENTE=false'
)
if ($oci) { $lineas += "OCI_CONFIG_DIR=$(Valor ($oci.Source -replace '\\', '/'))" }

[IO.File]::WriteAllLines($Salida, $lineas, (New-Object Text.UTF8Encoding($false)))

Write-Host "Listo: $Salida"
Write-Host "  Base de datos: $baseDatos | volumen: $volumen | OCI: $([bool]$oci)"
Write-Host "  (las credenciales se copiaron sin mostrarse)"
