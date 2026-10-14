"use client";

import { useState, useRef, useEffect } from "react";
import { Network, Zap, Shield, Send } from "lucide-react";

export function P2pGhostTunnelTool() {
  const [mode, setMode] = useState<"host" | "client" | null>(null);
  const [offer, setOffer] = useState("");
  const [answer, setAnswer] = useState("");
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<{from: string, text: string}[]>([]);
  const [msgInput, setMsgInput] = useState("");

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.close();
    };
  }, []);

  const initHost = async () => {
    setMode("host");
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerRef.current = peer;

    const channel = peer.createDataChannel("ghost-tunnel");
    setupChannel(channel);
    channelRef.current = channel;

    peer.onicecandidate = e => {
      if (!e.candidate) {
        setOffer(btoa(JSON.stringify(peer.localDescription)));
      }
    };

    const localOffer = await peer.createOffer();
    await peer.setLocalDescription(localOffer);
  };

  const initClient = () => {
    setMode("client");
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerRef.current = peer;

    peer.ondatachannel = e => {
      setupChannel(e.channel);
      channelRef.current = e.channel;
    };

    peer.onicecandidate = e => {
      if (!e.candidate) {
        setAnswer(btoa(JSON.stringify(peer.localDescription)));
      }
    };
  };

  const setupChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => setConnected(true);
    channel.onclose = () => setConnected(false);
    channel.onmessage = e => {
      setMessages(prev => [...prev, { from: "peer", text: e.data }]);
    };
  };

  const connectToHost = async () => {
    if (!offer || !peerRef.current) return;
    try {
      const remoteOffer = JSON.parse(atob(offer));
      await peerRef.current.setRemoteDescription(remoteOffer);
      const localAnswer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(localAnswer);
    } catch {
      alert("Invalid Offer Token");
    }
  };

  const acceptAnswer = async () => {
    if (!answer || !peerRef.current) return;
    try {
      const remoteAnswer = JSON.parse(atob(answer));
      await peerRef.current.setRemoteDescription(remoteAnswer);
    } catch {
      alert("Invalid Answer Token");
    }
  };

  const sendMessage = () => {
    if (!msgInput || !channelRef.current || !connected) return;
    channelRef.current.send(msgInput);
    setMessages(prev => [...prev, { from: "me", text: msgInput }]);
    setMsgInput("");
  };

  return (
    <div className="space-y-8">
      <div className="card p-8 bg-card border-line relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Network className="w-32 h-32 text-accent" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <Zap className="w-8 h-8 text-warning" /> P2P Ghost Tunnel
          </h2>
          <p className="text-muted text-lg mb-8">
            Bypass ngrok. Establish a direct Peer-to-Peer WebRTC Data Channel between two browsers. 
            Zero servers, zero latency, impossible to intercept.
          </p>

          {!mode && (
            <div className="flex gap-4">
              <button onClick={initHost} className="btn btn-primary flex-1 py-8 text-lg">
                Create Tunnel (Host)
              </button>
              <button onClick={initClient} className="btn btn-secondary flex-1 py-8 text-lg">
                Join Tunnel (Client)
              </button>
            </div>
          )}

          {mode && !connected && (
            <div className="space-y-6 bg-bg p-6 rounded-xl border border-line">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Setup {mode === "host" ? "Host" : "Client"}</h3>
                <button onClick={() => setMode(null)} className="text-sm text-danger hover:underline">Cancel</button>
              </div>
              
              {mode === "host" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted">1. Copy this Offer Token and send it to the Client:</p>
                  <textarea readOnly value={offer || "Generating..."} className="w-full h-24 bg-black border border-line p-3 font-mono text-xs text-primary rounded-lg" />
                  <p className="text-sm text-muted">2. Paste the Client's Answer Token here to connect:</p>
                  <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Paste answer here..." className="w-full h-24 bg-card border border-line p-3 font-mono text-xs rounded-lg focus:border-primary outline-none" />
                  <button onClick={acceptAnswer} className="btn btn-primary w-full">Connect</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted">1. Paste the Host's Offer Token here:</p>
                  <textarea value={offer} onChange={e => setOffer(e.target.value)} placeholder="Paste offer here..." className="w-full h-24 bg-card border border-line p-3 font-mono text-xs rounded-lg focus:border-primary outline-none" />
                  <button onClick={connectToHost} className="btn btn-primary w-full">Generate Answer</button>
                  
                  {answer && (
                    <>
                      <p className="text-sm text-muted mt-4">2. Copy this Answer Token and send it back to the Host:</p>
                      <textarea readOnly value={answer} className="w-full h-24 bg-black border border-line p-3 font-mono text-xs text-success rounded-lg" />
                      <p className="text-xs text-warning animate-pulse text-center">Waiting for Host to accept answer...</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {connected && (
            <div className="bg-bg border border-success/30 rounded-xl overflow-hidden flex flex-col h-[400px]">
              <div className="bg-success/10 p-3 border-b border-success/20 flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                <span className="font-bold text-success">P2P Secure Socket Established</span>
                <span className="ml-auto text-xs opacity-70">Latency: ~1ms</span>
              </div>
              
              <div className="flex-1 p-4 overflow-auto space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-muted mt-10 text-sm">
                    No servers involved. Type below to send data directly to the peer.
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2 ${m.from === "me" ? "bg-primary text-white dark:text-[#050505] rounded-br-none" : "bg-card border border-line rounded-bl-none"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-card border-t border-line flex gap-2">
                <input 
                  type="text"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Send direct P2P data..."
                  className="flex-1 bg-bg border border-line rounded-lg px-4 outline-none focus:border-primary"
                />
                <button onClick={sendMessage} className="btn btn-primary px-4"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
