# One commit per component, then push. Safe to re-run: each step only commits
# if that path group actually changed. Nothing is staged that is not listed.
$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath $PSScriptRoot
$log = Join-Path $PSScriptRoot '_pcanatomy-commit.log'
"=== $(Get-Date -Format s) ===" | Set-Content -LiteralPath $log

function Step([string]$msg, [string[]]$paths) {
  $existing = @($paths | Where-Object { Test-Path -LiteralPath $_ })
  if ($existing.Count -eq 0) { return }
  git add -- @existing 2>&1 | Out-Null
  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) { "skip : $msg" | Add-Content -LiteralPath $log; return }
  git commit -q -m $msg 2>&1 | Add-Content -LiteralPath $log
  "ok   : $msg" | Add-Content -LiteralPath $log
}

git rev-parse --abbrev-ref HEAD 2>&1 | Add-Content -LiteralPath $log

Step 'refs: add brushless-motor and cooler-mount references' @('lib/sources.ts','SOURCES.md')
Step 'parts: share realistic fans, fin stacks, fasteners and emissive strips' @('lib/parts.ts','lib/hardware.ts','lib/surfaces.ts','lib/silicon-texture.ts')
Step 'case: rebuild the chassis with see-through glass, lit fans and RGB' @('lib/machine.ts')
Step 'motherboard: raise detail on the board, sockets and headers' @('lib/mainboard.ts','lib/board-details.ts','lib/concepts/motherboard.ts')
Step 'cpu: package and socket geometry' @('lib/processor.ts')
Step 'psu: dissect the supply from mains inlet to output panel' @('lib/power-supply.ts','lib/concepts/psu.ts')
Step 'fan: dissect the case fan down to stator, bearing and driver' @('lib/fan-unit.ts','lib/concepts/fan.ts')
Step 'cooler: dissect the tower cooler from coldplate to fin stack' @('lib/cooler.ts','lib/concepts/cooler.ts')
Step 'disk: dissect the hard disk from cover to voice coil' @('lib/disk.ts','lib/concepts/disk.ts')
Step 'gpu: keep the card branch intact under the machine' @('lib/gpu-architecture.ts','lib/concepts/gpu.ts')
Step 'pc: name every part of the machine and open the new scales' @('lib/concepts/pc.ts','lib/concept.ts')
Step 'scene: own the dive ramp and see through glass when picking' @('lib/scene.ts','lib/picking.ts','lib/layout.ts')
Step 'levels: register the cooler and disk scales and group menus by branch' @('lib/levels.ts','lib/models.ts','lib/manifest.ts')
Step 'ui: subsystem menus, draggable disassembly and a quieter panel' @('app/page.tsx','app/viewer.tsx','app/main.tsx','app/layout.tsx')
Step 'style: darker stage, lighter components, no navy' @('app/globals.css','app/workbench.css','index.html')
Step 'test: check every scale renders, is named and cites a real source' @('tests/manifest.test.ts','tests/models.test.ts')
Step 'docs: rewrite the handoff for PC Anatomy' @('HANDOFF.md','README.md','docs')

# Anything left over from earlier work, so nothing is stranded.
git add -A -- ':!_pcanatomy-commit.ps1' ':!_pcanatomy-commit.log' 2>&1 | Out-Null
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -q -m 'chore: remaining PC Anatomy restructure work' 2>&1 | Add-Content -LiteralPath $log
  'ok   : chore: remaining PC Anatomy restructure work' | Add-Content -LiteralPath $log
}

'--- log ---' | Add-Content -LiteralPath $log
git log --oneline -25 2>&1 | Add-Content -LiteralPath $log
'--- push ---' | Add-Content -LiteralPath $log
git push -u origin main 2>&1 | Add-Content -LiteralPath $log
'--- status ---' | Add-Content -LiteralPath $log
git status --short --branch 2>&1 | Add-Content -LiteralPath $log
'DONE' | Add-Content -LiteralPath $log
