import './style.css'
import { PLAYER_1, PLAYER_2 } from '@rcade/plugin-input-classic'

// ============== DEBUG OVERLAY ==============
const DEBUG_ENABLED = true
const MAX_LOG_ENTRIES = 12

// Create debug overlay
const debugOverlay = document.createElement('div')
debugOverlay.id = 'debug-overlay'
debugOverlay.innerHTML = `
  <style>
    #debug-overlay {
      position: fixed;
      top: 4px;
      left: 4px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 8px;
      padding: 4px;
      border-radius: 2px;
      z-index: 999999;
      pointer-events: none;
      border: 1px solid #0f0;
    }
    #debug-overlay .controls {
      display: flex;
      gap: 1px;
      margin-bottom: 2px;
    }
    #debug-overlay .ctrl {
      background: #222;
      padding: 1px 2px;
      border-radius: 1px;
    }
    #debug-overlay .ctrl.active {
      background: #0a0;
    }
    #debug-overlay .log {
      font-size: 7px;
      max-height: 50px;
      overflow: hidden;
    }
    #debug-overlay .log-entry.up { color: #f80; }
    #debug-overlay .stats {
      color: #0ff;
      font-size: 7px;
      margin-top: 2px;
      border-top: 1px solid #333;
      padding-top: 2px;
    }
  </style>
  <div class="controls">
    <div class="ctrl" id="ctrl-P1_up">↑</div>
    <div class="ctrl" id="ctrl-P1_down">↓</div>
    <div class="ctrl" id="ctrl-P1_left">←</div>
    <div class="ctrl" id="ctrl-P1_right">→</div>
    <div class="ctrl" id="ctrl-P1_A">A</div>
    <div class="ctrl" id="ctrl-P1_B">B</div>
  </div>
  <div class="log" id="debug-log"></div>
  <div class="stats" id="debug-stats">poll:--ms raf:-- game:--fps</div>
`

if (DEBUG_ENABLED) {
  document.body.appendChild(debugOverlay)
}

// Debug state
const debugLog = []
let lastPollTime = performance.now()
let pollTimes = []
let frameCount = 0
let lastFpsTime = performance.now()
let currentFps = 0
let gameFps = '--'
let gameFrameTime = '--'
let phaserGame = null
let errorCount = 0

// Count errors
const originalConsoleError = console.error
console.error = (...args) => {
  errorCount++
  originalConsoleError.apply(console, args)
}

function addLogEntry(control, type) {
  const now = performance.now()
  const timestamp = (now / 1000).toFixed(3)
  const entry = {
    time: timestamp,
    control: control.replace('P1_', '').replace('P2_', ''),
    player: control.startsWith('P1') ? '1' : '2',
    type: type,
    latency: pollTimes.length > 0 ? (pollTimes.reduce((a,b) => a+b, 0) / pollTimes.length).toFixed(1) : '--'
  }
  debugLog.unshift(entry)
  if (debugLog.length > MAX_LOG_ENTRIES) debugLog.pop()
  updateLogDisplay()
}

function updateLogDisplay() {
  const logEl = document.getElementById('debug-log')
  if (!logEl) return
  logEl.innerHTML = debugLog.map(e =>
    `<div class="log-entry ${e.type === 'up' ? 'up' : ''}">${e.time} ${e.control}${e.type === 'down' ? '▼' : '▲'}</div>`
  ).join('')
}

function updateControlDisplay(control, active) {
  const el = document.getElementById(`ctrl-${control}`)
  if (el) {
    el.classList.toggle('active', active)
  }
}

function updateStats() {
  const statsEl = document.getElementById('debug-stats')
  if (!statsEl) return

  // Try to find Phaser game instance (various ways it might be exposed)
  if (!phaserGame) {
    phaserGame = window.game || window.Phaser?.GAMES?.[0] || null
    // Search through window properties for anything with a 'loop' that looks like Phaser
    if (!phaserGame) {
      for (const key of Object.keys(window)) {
        try {
          const val = window[key]
          if (val?.loop?.actualFps !== undefined || val?.loop?.delta !== undefined) {
            phaserGame = val
            break
          }
        } catch (e) {}
      }
    }
    // Try shadowRoot of custom elements
    if (!phaserGame) {
      const el = document.querySelector('[game]') || document.querySelector('pacman-game')
      if (el?.game) phaserGame = el.game
      if (el?.shadowRoot) {
        const inner = el.shadowRoot.querySelector('[game]')
        if (inner?.game) phaserGame = inner.game
      }
    }
  }

  // Get Phaser's internal FPS if available
  if (phaserGame?.loop) {
    gameFps = Math.round(phaserGame.loop.actualFps || phaserGame.loop.fps || '--')
    gameFrameTime = phaserGame.loop.delta ? phaserGame.loop.delta.toFixed(1) : '--'
  }

  const avgPoll = pollTimes.length > 0
    ? (pollTimes.reduce((a,b) => a+b, 0) / pollTimes.length).toFixed(1)
    : '--'
  statsEl.textContent = `poll:${avgPoll}ms raf:${currentFps} game:${gameFps} err:${errorCount}`
}

// ============== END DEBUG OVERLAY ==============

// Pac-Man uses arrow keys for movement
const controlMap = [
  { control: 'P1_up', key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  { control: 'P1_down', key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  { control: 'P1_left', key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  { control: 'P1_right', key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  // Player 2 also maps to arrow keys (same Pac-Man)
  { control: 'P2_up', key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  { control: 'P2_down', key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  { control: 'P2_left', key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  { control: 'P2_right', key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  // A/B buttons can be used for menu selection (Enter/Space)
  { control: 'P1_A', key: 'Enter', code: 'Enter', keyCode: 13 },
  { control: 'P1_B', key: ' ', code: 'Space', keyCode: 32 },
  { control: 'P2_A', key: 'Enter', code: 'Enter', keyCode: 13 },
  { control: 'P2_B', key: ' ', code: 'Space', keyCode: 32 },
]

// Track pressed state to detect changes
const pressedState = {}
for (const mapping of controlMap) {
  pressedState[mapping.control] = false
}

function dispatchKey(mapping, type) {
  const event = new KeyboardEvent(type, {
    key: mapping.key,
    code: mapping.code,
    keyCode: mapping.keyCode,
    which: mapping.keyCode,
    bubbles: true,
    cancelable: true
  })
  document.dispatchEvent(event)
}

function getControlState(control) {
  if (control === 'P1_up') return PLAYER_1.DPAD.up
  if (control === 'P1_down') return PLAYER_1.DPAD.down
  if (control === 'P1_left') return PLAYER_1.DPAD.left
  if (control === 'P1_right') return PLAYER_1.DPAD.right
  if (control === 'P1_A') return PLAYER_1.A
  if (control === 'P1_B') return PLAYER_1.B
  if (control === 'P2_up') return PLAYER_2.DPAD.up
  if (control === 'P2_down') return PLAYER_2.DPAD.down
  if (control === 'P2_left') return PLAYER_2.DPAD.left
  if (control === 'P2_right') return PLAYER_2.DPAD.right
  if (control === 'P2_A') return PLAYER_2.A
  if (control === 'P2_B') return PLAYER_2.B
  return false
}

function updateControls() {
  // Track poll timing
  const now = performance.now()
  const pollDelta = now - lastPollTime
  lastPollTime = now
  pollTimes.push(pollDelta)
  if (pollTimes.length > 60) pollTimes.shift()

  // Track FPS
  frameCount++
  if (now - lastFpsTime >= 1000) {
    currentFps = frameCount
    frameCount = 0
    lastFpsTime = now
  }

  for (const mapping of controlMap) {
    const isPressed = getControlState(mapping.control)
    if (isPressed && !pressedState[mapping.control]) {
      dispatchKey(mapping, 'keydown')
      if (DEBUG_ENABLED) {
        addLogEntry(mapping.control, 'down')
        updateControlDisplay(mapping.control, true)
      }
    } else if (!isPressed && pressedState[mapping.control]) {
      dispatchKey(mapping, 'keyup')
      if (DEBUG_ENABLED) {
        addLogEntry(mapping.control, 'up')
        updateControlDisplay(mapping.control, false)
      }
    }
    pressedState[mapping.control] = isPressed
  }

  if (DEBUG_ENABLED) {
    updateStats()
  }

  requestAnimationFrame(updateControls)
}

updateControls()

// Load the Pac-Man game script
const script = document.createElement('script')
script.src = '/index.min.js'
script.async = true
document.body.appendChild(script)
