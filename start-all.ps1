# =============================================================================
# CEO-UFPE - Sobe TUDO com um comando (Windows PowerShell): banco + API + UI.
#
# Uso (a partir da raiz do repositorio):
#   .\start-all.ps1
#   .\start-all.ps1 -Reset   -> recria o banco do zero (apaga dados) e sobe tudo
#
# O que faz:
#   1. Prepara banco + backend via projeto\backend\start.ps1 -NoDev
#      (Docker Postgres + migrations + seed, sem subir a API ainda).
#   2. Sobe a API (npm run dev) em background, em http://localhost:3000.
#   3. Espera a API responder em /health.
#   4. Sobe o frontend (npm run dev) em primeiro plano, em http://localhost:5173.
#   5. Ctrl+C encerra os DOIS processos (a API junto com o front).
#
# Requer: Docker Desktop ligado e Node 20+ (o start.ps1 checa isso pra voce).
# O banco (container) continua rodando apos o Ctrl+C; pare com:
#   cd projeto\backend ; docker compose down
# Se der erro de execucao de script: Set-ExecutionPolicy -Scope Process Bypass
# =============================================================================
param([switch]$Reset)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Backend  = Join-Path $PSScriptRoot "projeto\backend"
$Frontend = Join-Path $PSScriptRoot "projeto\frontend"
$apiProc  = $null

function Say($msg) { Write-Host "`n==> $msg" -ForegroundColor Red }

try {
  # 1. Banco + migrations + seed (reusa o start.ps1, sem subir a API ainda) ----
  Say "Preparando banco e backend (start.ps1 -NoDev)"
  if ($Reset) { & (Join-Path $Backend "start.ps1") -NoDev -Reset }
  else        { & (Join-Path $Backend "start.ps1") -NoDev }
  if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) { throw "Falha ao preparar o backend." }

  # 2. API em background -------------------------------------------------------
  Say "Subindo a API em http://localhost:3000 (background)"
  $apiProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" `
                           -WorkingDirectory $Backend -PassThru -NoNewWindow

  # 3. Espera a API responder (evita o front subir antes do backend) -----------
  Say "Aguardando a API ficar pronta"
  $ready = $false
  for ($i = 0; $i -lt 45; $i++) {
    if ($apiProc.HasExited) { throw "A API encerrou logo no inicio. Verifique os logs acima." }
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/health" -UseBasicParsing -TimeoutSec 2
      if ($r.StatusCode -eq 200) { Write-Host " API pronta."; $ready = $true; break }
    } catch { }
    Write-Host "." -NoNewline; Start-Sleep -Seconds 1
  }
  if (-not $ready) { throw "Timeout - a API nao respondeu em :3000/health." }

  # 4. Dependencias do frontend (so na 1a vez) ---------------------------------
  if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
    Say "Instalando dependencias do frontend (npm install)"
    Push-Location $Frontend; npm install; Pop-Location
  }

  # 5. Resumo + frontend em primeiro plano -------------------------------------
  Write-Host @"

--------------------------------------------------------------
 Tudo no ar:
   API ........ http://localhost:3000
   Frontend ... http://localhost:5173   (abre quando o Vite subir)

 Login (senha de todos: ceoufpe2026):
   gestor HO ......... ana.costa@ufpe.br
   almoxarife HO ..... joao.silva@ufpe.br
   solicitante CEO ... rafael.moura@ufpe.br
   gestora CEO ....... helena.lima@ufpe.br

 Ctrl+C encerra API + frontend. O banco (Docker) segue rodando;
 pare com:  cd projeto\backend ; docker compose down
--------------------------------------------------------------
"@
  Say "Subindo o frontend (Ctrl+C para parar tudo)"
  Push-Location $Frontend
  npm run dev
  Pop-Location
}
finally {
  # Garante que a API morra quando este script terminar (Ctrl+C, erro ou saida).
  if ($null -ne $apiProc -and -not $apiProc.HasExited) {
    Say "Encerrando a API (pid $($apiProc.Id))"
    Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
  }
}
