# =============================================================================
# CEO-UFPE - Bootstrap do backend em UM comando (Windows PowerShell).
# Sobe Postgres (docker), instala deps, aplica schema, popula dados e roda a API.
# Uso (a partir de projeto\backend):   .\start.ps1
#   .\start.ps1 -Reset    -> derruba o banco e recria do zero (apaga dados)
#   .\start.ps1 -NoDev    -> prepara tudo mas NAO sobe a API (so deixa pronto)
# Requer: Docker Desktop ligado, Node 20+.
# Se der erro de execucao de script:  Set-ExecutionPolicy -Scope Process Bypass
# =============================================================================
param([switch]$Reset, [switch]$NoDev)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Say($msg) { Write-Host "`n==> $msg" -ForegroundColor Red }

# 0. Pre-checagens ------------------------------------------------------------
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker nao encontrado. Ligue o Docker Desktop." }
if (-not (Get-Command node   -ErrorAction SilentlyContinue)) { throw "Node nao encontrado. Instale Node 20+." }
try { docker info | Out-Null } catch { throw "Docker daemon nao esta rodando. Abra o Docker Desktop e tente de novo." }

# 1. .env ---------------------------------------------------------------------
if (-not (Test-Path .env)) { Say "Criando .env a partir de .env.example"; Copy-Item .env.example .env }
else { Write-Host ".env ja existe - mantendo." }

# 2. Postgres -----------------------------------------------------------------
if ($Reset) { Say "Reset: derrubando banco e volume"; docker compose down -v }
Say "Subindo Postgres (porta 5433)"
docker compose up -d

Say "Aguardando o banco ficar pronto"
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  $status = (docker inspect -f '{{.State.Health.Status}}' ceo-estoque-db 2>$null)
  if ($status -eq "healthy") { Write-Host "Banco pronto."; $ready = $true; break }
  Write-Host "." -NoNewline; Start-Sleep -Seconds 2
}
if (-not $ready) { throw "Timeout esperando o banco." }

# 3. Dependencias -------------------------------------------------------------
if (-not (Test-Path node_modules)) { Say "Instalando dependencias (npm install)"; npm install }
else { Write-Host "node_modules ja existe - pulando install." }

# 4. Schema + dados -----------------------------------------------------------
Say "Aplicando migrations (drizzle)"; npm run db:migrate
Say "Populando dados de exemplo (seed)"; npm run db:seed

# 5. Resumo -------------------------------------------------------------------
Write-Host @"

--------------------------------------------------------------
 Pronto. Banco no ar (localhost:5433) com dados de exemplo.

 Usuarios de teste (senha de todos: ceoufpe2026):
   gestor HO ......... ana.costa@ufpe.br
   almoxarife HO ..... joao.silva@ufpe.br
   solicitante CEO ... rafael.moura@ufpe.br
   gestora CEO ....... helena.lima@ufpe.br

 Frontend (em OUTRO terminal):
   cd ..\frontend ; npm install ; npm run dev   -> UI em http://localhost:5173

 Comandos uteis:
   npm run dev        -> sobe a API em http://localhost:3000
   npm test           -> roda os testes (vitest)
   npm run db:studio  -> abre o Drizzle Studio (inspecionar o banco)
   .\start.ps1 -Reset -> recomeca o banco do zero
--------------------------------------------------------------
"@

# 6. API ----------------------------------------------------------------------
if ($NoDev) { Say "Tudo pronto (-NoDev: API nao iniciada). Rode 'npm run dev' quando quiser." }
else { Say "Subindo a API (Ctrl+C para parar)"; npm run dev }
