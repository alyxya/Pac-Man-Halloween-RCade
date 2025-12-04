import './style.css'
import { PLAYER_1, PLAYER_2 } from '@rcade/plugin-input-classic'

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

// Load the Pac-Man game script
const script = document.createElement('script')
script.src = '/index.min.js'
script.async = true
document.body.appendChild(script)
