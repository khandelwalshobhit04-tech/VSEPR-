
// A lightweight generative audio engine using Web Audio API
// Creates a "Sci-Fi Lab" atmosphere with ambient music and UI effects

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;

  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private melodyTimer: number | null = null;

  // C Minor Pentatonic Scale (C, Eb, F, G, Bb) across octaves for melody
  private melodyScale = [
    261.63, // C4
    311.13, // Eb4
    349.23, // F4
    392.00, // G4
    466.16, // Bb4
    523.25, // C5
    622.25, // Eb5
    698.46, // F5
    783.99  // G5
  ];

  constructor() {
    // Lazy initialization
  }

  public init() {
    if (this.isInitialized) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // 1. Master Mix
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Global Volume
      this.masterGain.connect(this.ctx.destination);

      // 2. Groups
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.4; // Music Volume
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5; // SFX Volume
      this.sfxGain.connect(this.masterGain);

      // 3. Delay Effect (Space Echo) for Music
      this.delayNode = this.ctx.createDelay();
      this.delayNode.delayTime.value = 0.45; // 450ms delay
      
      this.feedbackNode = this.ctx.createGain();
      this.feedbackNode.gain.value = 0.35; // Feedback amount

      // Routing: Music -> Delay -> Feedback -> Delay -> Master
      this.musicGain.connect(this.delayNode);
      this.delayNode.connect(this.feedbackNode);
      this.feedbackNode.connect(this.delayNode);
      this.delayNode.connect(this.masterGain); // Wet mix directly to master for clarity

      this.isInitialized = true;
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      // Smooth fade out/in
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.3, t, 0.2);
    }
    
    if (this.ctx) {
      if (mute) {
        if (this.melodyTimer) {
            clearTimeout(this.melodyTimer);
            this.melodyTimer = null;
        }
        // Suspend context to save CPU when muted, but give time for fade out
        setTimeout(() => { if(this.isMuted) this.ctx?.suspend(); }, 300);
      } else {
        this.ctx.resume();
        // Restart melody if it wasn't running
        if (!this.melodyTimer) {
            this.scheduleNextNote();
        }
      }
    }
  }

  public startAmbientDrone() {
    if (!this.ctx || !this.musicGain || !this.isInitialized) return;
    this.ctx.resume();

    const t = this.ctx.currentTime;

    // Layer 1: Deep Bass Drone (C2 - 65.41Hz)
    const droneOsc1 = this.ctx.createOscillator();
    const droneGain1 = this.ctx.createGain();
    droneOsc1.type = 'triangle';
    droneOsc1.frequency.value = 65.41;
    
    droneGain1.gain.setValueAtTime(0, t);
    droneGain1.gain.linearRampToValueAtTime(0.15, t + 2); // Slow fade in
    
    droneOsc1.connect(droneGain1);
    droneGain1.connect(this.musicGain);
    droneOsc1.start();

    // Layer 2: Subtle High Texture (Sine Detuned)
    const droneOsc2 = this.ctx.createOscillator();
    const droneGain2 = this.ctx.createGain();
    droneOsc2.type = 'sine';
    droneOsc2.frequency.value = 130.81; // C3
    
    droneGain2.gain.setValueAtTime(0, t);
    droneGain2.gain.linearRampToValueAtTime(0.05, t + 3);

    droneOsc2.connect(droneGain2);
    droneGain2.connect(this.musicGain);
    droneOsc2.start();
    
    // Start Generative Melody
    this.scheduleNextNote();
  }

  private scheduleNextNote() {
    if (this.isMuted || !this.ctx) return;

    // Play a note
    this.playAmbientNote();

    // Schedule next (irregular timing makes it feel organic)
    const delay = 3000 + Math.random() * 5000; // 3s to 8s gap
    this.melodyTimer = window.setTimeout(() => this.scheduleNextNote(), delay);
  }

  private playAmbientNote() {
    if (!this.ctx || !this.musicGain) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    
    // Pick random note from pentatonic scale
    const freq = this.melodyScale[Math.floor(Math.random() * this.melodyScale.length)];
    
    osc.frequency.value = freq;
    osc.type = 'sine'; // Pure tone

    // Envelope: Soft bell-like
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.1, t + 0.1); // Attack
    env.gain.exponentialRampToValueAtTime(0.001, t + 4.0); // Long Release

    osc.connect(env);
    env.connect(this.musicGain); // Goes to delay

    osc.start(t);
    osc.stop(t + 4.0);
  }

  // --- Sound Effects ---

  public playClick() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ctx.resume();
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High tech blip
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.05);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playSelect() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Soft toggle sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playSuccess() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ctx.resume();

    const t = this.ctx.currentTime;
    
    // Major Chord Arpeggio (C Major)
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const start = t + (i * 0.06);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      
      osc.start(start);
      osc.stop(start + 0.8);
    });
  }

  public playError() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Low Dissonant Buzz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.3); // Pitch Drop

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }
}

export const audioService = new AudioEngine();
