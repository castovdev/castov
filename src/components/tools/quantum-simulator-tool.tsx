"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Sphere } from "@react-three/drei";
import { Atom, Cpu } from "lucide-react";
import * as THREE from "three";

// Simple 2-Qubit State Simulator
// Initial State: |00> = [1, 0, 0, 0]
type QState = [number, number, number, number];

const getQubitProbs = (state: QState) => {
  return [
    Math.pow(Math.abs(state[0]), 2), // 00
    Math.pow(Math.abs(state[1]), 2), // 01
    Math.pow(Math.abs(state[2]), 2), // 10
    Math.pow(Math.abs(state[3]), 2), // 11
  ];
};

function BlochSphere({ position, label, prob }: { position: [number, number, number], label: string, prob: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
  });

  const isActive = prob > 0.1;
  const color = isActive ? "#00f0FF" : "#333333";

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[1, 32, 32]}>
        <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={prob * 2} transparent opacity={0.6} />
      </Sphere>
      {/* Probability Core */}
      <Sphere args={[prob * 0.8 + 0.1, 16, 16]}>
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={2} />
      </Sphere>
      <Text position={[0, -1.5, 0]} fontSize={0.3} color="white">{label}: {(prob * 100).toFixed(1)}%</Text>
    </group>
  );
}

export function QuantumSimulatorTool() {
  const [qState, setQState] = useState<QState>([1, 0, 0, 0]); // |00>
  const [circuit, setCircuit] = useState<string[]>([]);

  // Quantum Gates (Simplified Real-Number Matrices for 2 Qubits)
  const applyHadamard = (targetQubit: 0 | 1) => {
    const s = 1 / Math.sqrt(2);
    setQState(prev => {
      const next: QState = [0, 0, 0, 0];
      if (targetQubit === 0) { // H tensor I
        next[0] = prev[0] * s + prev[2] * s;
        next[1] = prev[1] * s + prev[3] * s;
        next[2] = prev[0] * s - prev[2] * s;
        next[3] = prev[1] * s - prev[3] * s;
      } else { // I tensor H
        next[0] = prev[0] * s + prev[1] * s;
        next[1] = prev[0] * s - prev[1] * s;
        next[2] = prev[2] * s + prev[3] * s;
        next[3] = prev[2] * s - prev[3] * s;
      }
      return next;
    });
    setCircuit(p => [...p, `H(Q${targetQubit})`]);
  };

  const applyCNOT = () => {
    // Control Q0, Target Q1
    setQState(prev => [prev[0], prev[1], prev[3], prev[2]]);
    setCircuit(p => [...p, "CNOT(Q0->Q1)"]);
  };

  const reset = () => {
    setQState([1, 0, 0, 0]);
    setCircuit([]);
  };

  const probs = getQubitProbs(qState);

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      <div className="bg-[#020205] border border-[#00f0FF]/20 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <div className="flex items-center gap-4 mb-8">
          <Atom className="w-10 h-10 text-[#00f0FF] animate-[spin_10s_linear_infinite]" />
          <div>
            <h2 className="text-3xl font-black uppercase tracking-widest text-[#00f0FF] flex items-center gap-2">
              Quantum Web Simulator
            </h2>
            <p className="text-muted font-mono text-xs mt-1">Browser-Native 2-Qubit Quantum Circuit execution via Matrix Tensors</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Circuit Builder */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-sm">
              <h3 className="text-[#10B981] font-bold mb-4 uppercase tracking-widest flex items-center gap-2"><Cpu className="w-4 h-4"/> Circuit Logic</h3>
              <div className="flex gap-2 mb-4">
                <button onClick={() => applyHadamard(0)} className="bg-[#00f0FF]/20 hover:bg-[#00f0FF]/40 border border-[#00f0FF]/50 text-[#00f0FF] w-12 h-12 rounded flex items-center justify-center font-bold">H0</button>
                <button onClick={() => applyHadamard(1)} className="bg-[#00f0FF]/20 hover:bg-[#00f0FF]/40 border border-[#00f0FF]/50 text-[#00f0FF] w-12 h-12 rounded flex items-center justify-center font-bold">H1</button>
                <button onClick={applyCNOT} className="bg-[#a855f7]/20 hover:bg-[#a855f7]/40 border border-[#a855f7]/50 text-[#a855f7] px-4 rounded flex items-center justify-center font-bold">CNOT</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-auto">
                <div className="text-muted">INITIAL STATE: |00&gt;</div>
                {circuit.map((gate, i) => <div key={i} className="text-white">[{i+1}] {gate}</div>)}
              </div>
              <button onClick={reset} className="mt-4 w-full py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded uppercase font-bold text-xs tracking-widest hover:bg-red-500/20">Reset Entanglement</button>
            </div>
            
            <div className="bg-[#00f0FF]/10 p-4 rounded-xl border border-[#00f0FF]/20 text-xs font-mono">
              <strong className="text-[#00f0FF]">Hint:</strong> Click H0 then CNOT to create <span className="text-white">Quantum Entanglement (Bell State)</span>. Notice how the probabilities become perfectly 50/50 for |00&gt; and |11&gt;.
            </div>
          </div>

          {/* 3D Visualizer */}
          <div className="lg:col-span-2 bg-black border border-white/10 rounded-xl h-[400px] relative overflow-hidden shadow-inner">
            <div className="absolute top-4 left-4 z-10 font-mono text-xs uppercase tracking-widest text-muted">
              Probability State Vector Space
            </div>
            <Canvas camera={{ position: [0, 2, 8] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#00f0FF" />
              
              <BlochSphere position={[-3, 0, 0]} label="|00>" prob={probs[0]} />
              <BlochSphere position={[-1, 0, 0]} label="|01>" prob={probs[1]} />
              <BlochSphere position={[1, 0, 0]} label="|10>" prob={probs[2]} />
              <BlochSphere position={[3, 0, 0]} label="|11>" prob={probs[3]} />
              
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
