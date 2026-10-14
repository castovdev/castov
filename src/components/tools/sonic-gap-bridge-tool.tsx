"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, Mic, Activity, ShieldAlert } from "lucide-react";

const FREQ_0 = 18000; // 18 kHz (near ultrasonic)
const FREQ_1 = 19000; // 19 kHz
const BAUD_RATE = 150; // ms per bit
const START_FREQ = 17000;

export function SonicGapBridgeTool() {
  const [mode, setMode] = useState<"idle" | "tx" | "rx">("idle");
  const [payload, setPayload] = useState("CASTOV");
  const [receivedBits, setReceivedBits] = useState("");
  const [receivedText, setReceivedText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio context refs
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const rafId = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        audioCtx.current.close().catch(() => {});
      }
    };
  }, []);

  // --- TRANSMITTER (Tx) ---
  const transmit = async () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    setMode("tx");
    
    // String to Binary (ASCII)
    const binary = payload.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    
    const playFreq = (freq: number, duration: number) => {
      return new Promise<void>(resolve => {
        const osc = audioCtx.current!.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(audioCtx.current!.destination);
        osc.start();
        setTimeout(() => {
          osc.stop();
          resolve();
        }, duration);
      });
    };

    // Transmission Sequence
    await playFreq(START_FREQ, 300); // Start marker
    for (const bit of binary) {
      await playFreq(bit === '1' ? FREQ_1 : FREQ_0, BAUD_RATE);
    }
    
    setMode("idle");
  };

  // --- RECEIVER (Rx) ---
  const receive = async () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    setMode("rx");
    setReceivedBits("");
    setReceivedText("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = audioCtx.current.createMediaStreamSource(stream);
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 2048;
      source.connect(analyser.current);
      
      const bufferLength = analyser.current.frequencyBinCount;
      dataArray.current = new Uint8Array(bufferLength);
      
      let isReceiving = false;
      let bits = "";
      let lastProcessTime = 0;

      const detectFrequency = () => {
        if (!analyser.current || !dataArray.current || mode !== "rx") return;
        analyser.current.getByteFrequencyData(dataArray.current as any);
        
        const sampleRate = audioCtx.current!.sampleRate;
        const binSize = sampleRate / analyser.current.fftSize;
        
        const getAmp = (freq: number) => {
          const bin = Math.floor(freq / binSize);
          return dataArray.current![bin];
        };

        const ampStart = getAmp(START_FREQ);
        const amp0 = getAmp(FREQ_0);
        const amp1 = getAmp(FREQ_1);
        
        const threshold = 150;
        const now = performance.now();

        if (ampStart > threshold && !isReceiving) {
          isReceiving = true;
          lastProcessTime = now + 150; // offset wait
        } else if (isReceiving && now - lastProcessTime > BAUD_RATE * 0.8) {
          if (amp1 > threshold) {
            bits += "1";
            lastProcessTime = now;
            setReceivedBits(bits);
          } else if (amp0 > threshold) {
            bits += "0";
            lastProcessTime = now;
            setReceivedBits(bits);
          }
          
          // Auto decode every 8 bits
          if (bits.length % 8 === 0 && bits.length > 0) {
            let str = "";
            for (let i = 0; i < bits.length; i += 8) {
              const charCode = parseInt(bits.slice(i, i + 8), 2);
              if (charCode >= 32 && charCode <= 126) str += String.fromCharCode(charCode);
            }
            setReceivedText(str);
          }
        }

        drawVisualizer();
        rafId.current = requestAnimationFrame(detectFrequency);
      };
      
      detectFrequency();
    } catch {
      alert("Microphone access denied or unavailable.");
      setMode("idle");
    }
  };

  const stopReceive = () => {
    setMode("idle");
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  // --- CANVAS VISUALIZER ---
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser.current || !dataArray.current) return;
    const ctx = canvas.getContext("2d")!;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / analyser.current.frequencyBinCount) * 5;
    let x = 0;
    
    // Draw FFT Spectrogram
    for(let i = 0; i < analyser.current.frequencyBinCount; i += 5) {
      const barHeight = (dataArray.current[i] / 255) * canvas.height;
      const r = barHeight + 25 * (i/analyser.current.frequencyBinCount);
      const g = 250 * (i/analyser.current.frequencyBinCount);
      const b = 250;
      
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-field border border-line relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
                Air-Gapped Audio Bridge
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">Sonic-Gap Bridge</h2>
              <p className="text-muted text-xs sm:text-sm mt-0.5">Ultrasonic acoustic data transfer protocol (FSK 18kHz - 19kHz)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border ${
              mode === "tx" 
                ? "bg-blue-500/10 text-blue-500 border-blue-500/30" 
                : mode === "rx" 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                : "bg-bg text-muted border-line"
            }`}>
              <span className={`w-2 h-2 rounded-full ${mode === "tx" ? "bg-blue-500 animate-pulse" : mode === "rx" ? "bg-emerald-500 animate-ping" : "bg-muted"}`} />
              {mode === "tx" ? "TRANSMITTING" : mode === "rx" ? "LISTENING" : "READY / IDLE"}
            </span>
          </div>
        </div>

        {/* Dual Panels: TX & RX */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* TRANSMITTER */}
          <div className="bg-bg border border-line rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-accent" /> Transmitter (Tx)
                </span>
                <span className="text-[10px] font-mono text-muted">Speaker Output</span>
              </div>
              <label className="text-xs font-medium text-muted block mb-1">Payload to Transmit (Max 10 chars)</label>
              <input 
                type="text" 
                aria-label="Payload to Transmit"
                maxLength={10} 
                value={payload} 
                onChange={e => setPayload(e.target.value.toUpperCase())} 
                disabled={mode !== "idle"}
                className="w-full bg-field border border-line rounded-xl px-4 py-3 font-mono text-sm text-fg outline-none uppercase focus:ring-2 focus:ring-accent/40"
                placeholder="CASTOV"
              />
            </div>

            <button 
              type="button"
              onClick={transmit} 
              disabled={mode !== "idle" || !payload}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-white" />
              {mode === "tx" ? "Broadcasting Frequencies..." : "Transmit via Audio"}
            </button>
          </div>

          {/* RECEIVER */}
          <div className="bg-bg border border-line rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-500" /> Receiver (Rx)
                </span>
                <span className="text-[10px] font-mono text-muted">Microphone FFT</span>
              </div>
              <label className="text-xs font-medium text-muted block mb-1">Decoded Acoustic Data</label>
              <div className="w-full min-h-[46px] bg-field border border-line rounded-xl px-4 py-3 font-mono text-sm text-emerald-500 flex items-center justify-between">
                <span className="font-bold">{receivedText || "// AWAITING SONIC SIGNAL"}</span>
                {receivedBits && <span className="text-[10px] text-muted">{receivedBits.slice(-16)}</span>}
              </div>
            </div>

            <button 
              type="button"
              onClick={mode === "rx" ? stopReceive : receive} 
              disabled={mode === "tx"}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 border cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                mode === "rx" 
                  ? "bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/20" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent"
              }`}
            >
              <Mic className="w-4 h-4" />
              {mode === "rx" ? "Stop Listening" : "Listen for Ultrasonic Data"}
            </button>
          </div>
        </div>

        {/* FFT SPECTROGRAM */}
        <div className="mt-8 border border-line rounded-2xl bg-bg p-4 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-muted">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">Real-Time FFT Spectrogram</span>
            </div>
            <span className="text-[10px] font-mono text-muted">Acoustic spectrum 16kHz - 20kHz</span>
          </div>
          <div className="h-44 w-full bg-field rounded-xl overflow-hidden relative border border-line/60">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
