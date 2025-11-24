/**
 * Utilitário para tocar sons de notificação
 */

let audioContext: AudioContext | null = null;

/**
 * Toca um som de notificação usando Web Audio API
 * Gera um som sintético (sem necessidade de arquivo externo)
 */
export function playNotificationSound() {
  try {
    // Criar AudioContext se não existir
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Som de notificação agradável (duas notas)
    const playBeep = (frequency: number, duration: number, delay: number = 0) => {
      const oscillator = audioContext!.createOscillator();
      const gainNode = audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext!.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Envelope ADSR suave
      const now = audioContext!.currentTime + delay;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05); // Decay
      gainNode.gain.setValueAtTime(0.2, now + duration - 0.05); // Sustain
      gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release

      oscillator.start(now);
      oscillator.stop(now + duration);
    };

    // Toca duas notas (som característico de notificação)
    playBeep(800, 0.15, 0);    // Primeira nota (Mi)
    playBeep(1000, 0.2, 0.12);  // Segunda nota (Dó)

    console.log('🔊 Som de notificação tocado');
  } catch (error) {
    console.error('❌ Erro ao tocar som:', error);
  }
}

/**
 * Toca um som mais discreto (single beep)
 */
export function playQuietBeep() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 600;
    oscillator.type = 'sine';

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);

    console.log('🔔 Beep discreto tocado');
  } catch (error) {
    console.error('❌ Erro ao tocar beep:', error);
  }
}

/**
 * Verifica se o áudio está habilitado no navegador
 */
export function isAudioEnabled(): boolean {
  try {
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  } catch {
    return false;
  }
}
