import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'

const SCAN_BEEP = require('../../assets/sounds/scan-beep.wav')

let prepared = false
let player: ReturnType<typeof createAudioPlayer> | null = null

async function ensureAudioMode() {
  if (prepared) return
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    allowsRecording: false,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  })
  prepared = true
}

function ensurePlayer() {
  if (!player) {
    player = createAudioPlayer(SCAN_BEEP)
  }
  return player
}

/** Short till-style beep when a barcode is read (no-op if playback fails). */
export async function playScanBeep(): Promise<void> {
  try {
    await ensureAudioMode()
    const audio = ensurePlayer()
    audio.seekTo(0)
    audio.play()
  } catch {
    /* camera scan still works without sound */
  }
}
