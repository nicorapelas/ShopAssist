import { Audio } from 'expo-av'

let prepared = false

async function ensureAudioMode() {
  if (prepared) return
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  })
  prepared = true
}

/** Short till-style beep when a barcode is read (no-op if playback fails). */
export async function playScanBeep(): Promise<void> {
  try {
    await ensureAudioMode()
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/scan-beep.wav'),
      { shouldPlay: true, volume: 1.0 },
    )
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync()
      }
    })
  } catch {
    /* camera scan still works without sound */
  }
}
