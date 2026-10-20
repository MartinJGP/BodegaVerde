// Utilidad de audio basada en Web Audio API nativo (sin dependencias de archivos externos)
class SoundManager {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  // Obtener o inicializar el contexto de audio
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    }

    return this.ctx;
  }

  // Desbloquear audio tras el primer clic o interacción del usuario
  public unlockAudio() {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (ctx && ctx.state === 'running') {
      this.isUnlocked = true;
    }
  }

  // Chime armonioso de 2 tonos para plato listo (Ding-Dong elegante de restaurante/cafetería)
  // Tono 1: Mi (E5 - 659.25 Hz), Tono 2: La (A5 - 880.00 Hz) con caída exponencial suave
  public playOrderReady() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // --- Primer tono (659.25 Hz) ---
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // --- Segundo tono más alto y resonante (880.00 Hz) ---
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.15);

      gain2.gain.setValueAtTime(0.001, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.25);
    } catch (e) {
      console.warn('Audio no disponible o bloqueado por política del navegador:', e);
    }
  }

  // Sonido corto y suave de acción completada (ej. pedido enviado o confirmado)
  public playActionComplete() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio no disponible:', e);
    }
  }
}

export const soundManager = new SoundManager();
