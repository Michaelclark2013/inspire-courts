// Two-tone audio chime — used for confirmation on successful actions
// in environments where staff are in a noisy gym (game-day check-in,
// payment, etc.). Pure Web Audio so we don't ship an audio asset.
//
// Browsers block AudioContext until a user gesture; every chime here
// fires from inside a click handler so the gesture chain is valid.
// On older browsers without AudioContext (or when the page is muted),
// the call silently noops — never throws.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    type WindowWithAC = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const w = window as WindowWithAC;
    if (!ctx) {
      const Ctor = w.AudioContext || w.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    // iOS sometimes leaves the context in a `suspended` state until a
    // user gesture explicitly resumes it. resume() is a no-op when
    // already running.
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, atSeconds: number, durSeconds: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // Quick attack + decay so the tone is a tap, not a hum.
  gain.gain.setValueAtTime(0, c.currentTime + atSeconds);
  gain.gain.linearRampToValueAtTime(0.18, c.currentTime + atSeconds + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + atSeconds + durSeconds);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + atSeconds);
  osc.stop(c.currentTime + atSeconds + durSeconds + 0.05);
}

/**
 * Two-tone success chime. Best paired with triggerHaptic("light")
 * for a multimodal "got it" signal in noisy environments.
 */
export function chimeSuccess(): void {
  const c = getCtx();
  if (!c) return;
  // C5 → E5: pleasant, recognizable as "yes."
  tone(c, 523.25, 0, 0.12);
  tone(c, 659.25, 0.1, 0.16);
}

/**
 * One-tone descending chime for failure/undo. Subtler than the
 * success ding — front desk should notice without alarming nearby
 * parents.
 */
export function chimeFail(): void {
  const c = getCtx();
  if (!c) return;
  // E5 → C5
  tone(c, 659.25, 0, 0.1);
  tone(c, 523.25, 0.08, 0.18);
}
