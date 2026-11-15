let ctx: AudioContext | null = null

/** Call from a user gesture so iOS lets us play audio later. */
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* audio unavailable */
  }
}

export function restDoneAlert() {
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    /* ignore */
  }
  if (!ctx) return
  const t0 = ctx.currentTime
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    const t = t0 + i * 0.22
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.2)
  }
}
