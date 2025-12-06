import './style.css'
import { PLAYER_1, PLAYER_2 } from '@rcade/plugin-input-classic'

// Debug info overlay - shows rendering dimensions
const info = document.createElement('div')
info.style.cssText = `
  position: fixed; top: 0; left: 0; background: rgba(0,0,0,0.8);
  color: #0f0; font: 8px monospace; padding: 2px; z-index: 99999;
`
document.body.appendChild(info)

function updateDebugInfo() {
  const iframes = document.querySelectorAll('iframe')
  const iframe = iframes[0]

  let canvasInfo = 'no access'
  let error = ''

  if (iframe) {
    try {
      const doc = iframe.contentDocument
      const canvas = doc?.querySelector('canvas')
      if (canvas) {
        canvasInfo = `${canvas.width}x${canvas.height} (${canvas.clientWidth}x${canvas.clientHeight})`
      } else {
        canvasInfo = 'no canvas in iframe'
      }
    } catch(e) {
      error = e.message
    }
  }

  info.innerHTML = `
    window: ${window.innerWidth}x${window.innerHeight}<br>
    iframes: ${iframes.length}<br>
    iframeEl: ${iframe?.clientWidth}x${iframe?.clientHeight}<br>
    canvas: ${canvasInfo}<br>
    err: ${error}<br>
    dpr: ${window.devicePixelRatio}
  `
}
setInterval(updateDebugInfo, 1000)

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
  for (const mapping of controlMap) {
    const isPressed = getControlState(mapping.control)
    if (isPressed && !pressedState[mapping.control]) {
      dispatchKey(mapping, 'keydown')
    } else if (!isPressed && pressedState[mapping.control]) {
      dispatchKey(mapping, 'keyup')
    }
    pressedState[mapping.control] = isPressed
  }
  requestAnimationFrame(updateControls)
}

updateControls()

// Restore native addEventListener before loading Phaser game
// RCade platform overrides these to block direct input handling,
// but Phaser needs them to initialize its input system
try {
  const nativeDocAddEventListener = Document.prototype.addEventListener
  const nativeWinAddEventListener = Window.prototype.addEventListener
  const nativeElemAddEventListener = EventTarget.prototype.addEventListener

  if (document.addEventListener.toString().includes('disabled')) {
    document.addEventListener = nativeDocAddEventListener.bind(document)
  }
  if (window.addEventListener.toString().includes('disabled')) {
    window.addEventListener = nativeWinAddEventListener.bind(window)
  }
  Document.prototype.addEventListener = nativeDocAddEventListener
  Window.prototype.addEventListener = nativeWinAddEventListener
  EventTarget.prototype.addEventListener = nativeElemAddEventListener
} catch (e) {
  console.warn('Could not restore native addEventListener:', e)
}

// Force Canvas2D renderer instead of WebGL (better for Pi without good GPU)
window.FORCE_CANVAS = true

// Load the Pac-Man game script
const script = document.createElement('script')
script.src = '/index.min.js'
script.async = true
document.body.appendChild(script)
