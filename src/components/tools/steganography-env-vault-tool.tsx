"use client";

import { useState, useRef } from "react";
import { Lock, Image as ImageIcon, ShieldCheck, Unlock, KeyRound, Activity } from "lucide-react";

// --- WebCrypto API Utilities ---
const getPasswordKey = async (password: string, salt: Uint8Array) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
};

const encryptAES = async (text: string, password: string): Promise<Uint8Array> => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getPasswordKey(password, salt);
  const encryptedBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  const payload = new Uint8Array(16 + 12 + encryptedBuf.byteLength);
  payload.set(salt, 0); payload.set(iv, 16); payload.set(new Uint8Array(encryptedBuf), 28);
  return payload;
};

const decryptAES = async (payload: Uint8Array, password: string): Promise<string> => {
  if (payload.length < 28) throw new Error("Invalid payload length");
  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 28);
  const ciphertext = payload.slice(28);
  const key = await getPasswordKey(password, salt);
  const decryptedBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decryptedBuf);
};

const bufToBinStr = (buf: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += buf[i].toString(2).padStart(8, "0");
  return bin;
};

const binStrToBuf = (bin: string) => {
  const buf = new Uint8Array(Math.floor(bin.length / 8));
  for (let i = 0; i < buf.length; i++) buf[i] = parseInt(bin.substring(i * 8, (i + 1) * 8), 2);
  return buf;
};

// Holographic Scanner Overlay Component
function HolographicScanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-lg bg-black/40">
      <div className="w-full h-2 bg-[#00f0FF] shadow-[0_0_20px_2px_#00f0FF] animate-[scan_2s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px] opacity-30" />
    </div>
  );
}

export function SteganographyEnvVaultTool() {
  const [envText, setEnvText] = useState("DATABASE_URL=postgres://user:pass@localhost:5432/db\nAPI_KEY=sk_test_12345");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [password, setPassword] = useState("");
  const [decodedText, setDecodedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [heatmapSrc, setHeatmapSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target?.result as string);
        setDecodedText(""); setHeatmapSrc(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = (callback: (ctx: CanvasRenderingContext2D, imgData: ImageData, canvas: HTMLCanvasElement) => void) => {
    if (!imageSrc || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      callback(ctx, imgData, canvas);
    };
    img.src = imageSrc;
  };

  const generateHeatmap = (canvas: HTMLCanvasElement, imgData: ImageData, changedBits: number) => {
    const heatData = new Uint8ClampedArray(imgData.data);
    let modifications = 0;
    // Highlight modified pixels in bright neon pink/cyan
    for (let i = 0; i < heatData.length; i += 4) {
      if (modifications < changedBits) {
        heatData[i] = 255;   // R
        heatData[i+1] = 0;   // G
        heatData[i+2] = 128; // B
        modifications += 3;
      } else {
        // Grayscale the rest to make heatmap pop
        const avg = (heatData[i] + heatData[i+1] + heatData[i+2]) / 3;
        heatData[i] = avg * 0.3;
        heatData[i+1] = avg * 0.3;
        heatData[i+2] = avg * 0.3;
      }
    }
    const heatCtx = canvas.getContext("2d");
    if (heatCtx) {
      heatCtx.putImageData(new ImageData(heatData, canvas.width, canvas.height), 0, 0);
      setHeatmapSrc(canvas.toDataURL("image/png"));
    }
  };

  const handleEncode = async () => {
    if (!imageSrc || !password) return alert("Image and Password required.");
    setIsProcessing(true);
    setHeatmapSrc(null);
    
    // Simulate complex cyber processing delay for cinematic effect
    setTimeout(async () => {
      try {
        const payloadBuf = await encryptAES(envText, password);
        const binaryPayload = bufToBinStr(payloadBuf);
        const lengthBin = binaryPayload.length.toString(2).padStart(32, "0");
        const fullBinary = lengthBin + binaryPayload;

        processImage((ctx, imgData, canvas) => {
          const data = imgData.data;
          const availableBits = (data.length / 4) * 3;
          if (fullBinary.length > availableBits) {
            alert(`Image too small. Need ${fullBinary.length} bits, have ${availableBits}.`);
            setIsProcessing(false); return;
          }

          let binIndex = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (binIndex < fullBinary.length) data[i] = (data[i] & ~1) | parseInt(fullBinary[binIndex++]);
            if (binIndex < fullBinary.length) data[i+1] = (data[i+1] & ~1) | parseInt(fullBinary[binIndex++]);
            if (binIndex < fullBinary.length) data[i+2] = (data[i+2] & ~1) | parseInt(fullBinary[binIndex++]);
            if (binIndex >= fullBinary.length) break;
          }
          ctx.putImageData(imgData, 0, 0);
          
          generateHeatmap(canvas, imgData, fullBinary.length);

          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = "castov_vault_encoded.png";
          a.click();
          setIsProcessing(false);
        });
      } catch (e: any) {
        alert("Encryption failed: " + e.message);
        setIsProcessing(false);
      }
    }, 1500); // 1.5s cinematic delay
  };

  const handleDecode = () => {
    if (!imageSrc || !password) return alert("Image and Password required.");
    setIsProcessing(true);
    
    setTimeout(() => {
      processImage(async (ctx, imgData, canvas) => {
        try {
          const data = imgData.data;
          let lengthBin = "";
          let i = 0;
          while (lengthBin.length < 32 && i < data.length) {
            if (lengthBin.length < 32) lengthBin += (data[i] & 1).toString();
            if (lengthBin.length < 32) lengthBin += (data[i+1] & 1).toString();
            if (lengthBin.length < 32) lengthBin += (data[i+2] & 1).toString();
            i += 4;
          }
          
          const payloadLength = parseInt(lengthBin, 2);
          if (payloadLength <= 0 || payloadLength > (data.length / 4) * 3) throw new Error("No hidden vault found.");

          let allBits = "";
          const totalBitsNeeded = 32 + payloadLength;
          for (let j = 0; j < data.length && allBits.length < totalBitsNeeded; j += 4) {
            if (allBits.length < totalBitsNeeded) allBits += (data[j] & 1).toString();
            if (allBits.length < totalBitsNeeded) allBits += (data[j+1] & 1).toString();
            if (allBits.length < totalBitsNeeded) allBits += (data[j+2] & 1).toString();
          }
          
          const payloadBin = allBits.substring(32, 32 + payloadLength);
          if (payloadBin.length !== payloadLength) throw new Error("Image corrupted.");

          generateHeatmap(canvas, imgData, totalBitsNeeded);

          const payloadBuf = binStrToBuf(payloadBin);
          const decrypted = await decryptAES(payloadBuf, password);
          setDecodedText(decrypted);
        } catch {
          alert("Decryption failed. Incorrect Password or corrupted image.");
          setDecodedText("");
        } finally {
          setIsProcessing(false);
        }
      });
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex gap-4 border-b border-[#00f0FF]/20 pb-4">
        <button onClick={() => setMode("encode")} className={`px-6 py-2 font-bold rounded-lg text-sm tracking-wider uppercase transition-all duration-300 ${mode === "encode" ? "bg-[#00f0FF]/20 text-[#00f0FF] border border-[#00f0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]" : "text-muted hover:text-white border border-transparent"}`}>
          <Lock className="w-4 h-4 inline mr-2" /> Encode Vault
        </button>
        <button onClick={() => setMode("decode")} className={`px-6 py-2 font-bold rounded-lg text-sm tracking-wider uppercase transition-all duration-300 ${mode === "decode" ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-muted hover:text-white border border-transparent"}`}>
          <Unlock className="w-4 h-4 inline mr-2" /> Decode Vault
        </button>
      </div>

      <div className="card p-8 bg-[#020204] border-[#00f0FF]/20 relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.05)] group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
          <ShieldCheck className="w-96 h-96 text-[#00f0FF]" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-4">
            <label className="font-bold text-xs tracking-widest text-[#00f0FF] uppercase flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Carrier Matrix (PNG)
            </label>
            <div className="w-full h-56 border-2 border-dashed border-[#00f0FF]/30 rounded-xl flex flex-col items-center justify-center relative bg-black/50 hover:bg-[#00f0FF]/5 hover:border-[#00f0FF]/60 transition-all overflow-hidden shadow-inner">
              <input type="file" aria-label="Upload carrier PNG image" accept="image/png" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" disabled={isProcessing} />
              
              <HolographicScanner active={isProcessing} />

              {imageSrc ? (
                <div className="relative w-full h-full p-2 flex items-center justify-center z-10">
                  <img src={imageSrc} className={`max-w-full max-h-full object-contain drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] ${isProcessing ? 'opacity-50 blur-[1px]' : ''} transition-all`} alt="Carrier" />
                </div>
              ) : (
                <div className="text-center text-muted group-hover:text-[#00f0FF] transition-colors z-10">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50 group-hover:opacity-100" />
                  <span className="text-xs font-mono tracking-widest uppercase">Drop PNG Sector Here</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="font-bold text-xs tracking-widest text-[#10B981] uppercase flex items-center gap-2">
              <Lock className="w-4 h-4" /> {mode === "encode" ? "Payload Data (.env)" : "Decrypted Data"}
            </label>
            {mode === "encode" ? (
              <textarea 
                aria-label="Payload Data (.env)"
                value={envText} onChange={e => setEnvText(e.target.value)} disabled={isProcessing}
                className="w-full h-56 bg-black/50 border border-[#10B981]/30 rounded-xl p-4 font-mono text-xs resize-none focus:border-[#10B981] outline-none shadow-inner text-[#10B981]/90"
              />
            ) : (
              <div className="w-full h-56 bg-black/80 border border-[#10B981]/50 rounded-xl p-4 font-mono text-xs overflow-auto text-[#10B981] shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] relative">
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <div className="text-[#10B981] animate-pulse font-mono tracking-widest">DECRYPTING LSB MATRIX...</div>
                  </div>
                ) : decodedText ? (
                  <pre className="whitespace-pre-wrap">{decodedText}</pre>
                ) : (
                  <span className="opacity-40 select-none">// AWAITING DECRYPTION SEQUENCE</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {heatmapSrc && !isProcessing && (
          <div className="mt-6 p-4 bg-black/40 border border-pink-500/30 rounded-xl relative z-10 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex-1 space-y-2">
              <h4 className="text-xs font-bold text-pink-500 uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4" /> Pixel Alteration Heatmap</h4>
              <p className="text-[10px] text-muted font-mono">Visualizing the exact LSB modified pixels (Pink) containing the encrypted AES-GCM payload. The rest of the image remains visually identical.</p>
            </div>
            <img src={heatmapSrc} alt="Heatmap" className="w-24 h-24 object-contain rounded border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]" />
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-[#00f0FF]/20 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
            <div className="flex-1 relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00f0FF]/50" />
              <input 
                type="password" aria-label="Master AES-256 Key" placeholder="ENTER MASTER AES-256 KEY" value={password} onChange={e => setPassword(e.target.value)} disabled={isProcessing}
                className="w-full pl-12 pr-4 py-4 bg-black/50 border border-[#00f0FF]/30 rounded-xl outline-none focus:border-[#00f0FF] font-mono text-sm shadow-inner transition-colors"
              />
            </div>
            
            <button 
              onClick={mode === "encode" ? handleEncode : handleDecode} 
              disabled={isProcessing || !imageSrc || !password}
              className={`flex-shrink-0 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${mode === "encode" ? "bg-[#00f0FF] text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]" : "bg-[#10B981] text-black hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"}`}
            >
              {isProcessing ? (
                <><Lock className="w-5 h-5 animate-pulse" /> {mode === "encode" ? "ENCRYPTING..." : "DECRYPTING..."}</>
              ) : (
                <><Lock className="w-5 h-5" /> {mode === "encode" ? "SEAL VAULT" : "BREACH VAULT"}</>
              )}
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* Global CSS for the scanner animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
      `}} />
    </div>
  );
}
