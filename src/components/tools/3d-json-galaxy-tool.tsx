"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line, Stats, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BoxIcon, UploadCloudIcon, Crosshair } from "lucide-react";
import * as THREE from "three";

interface NodeData {
  id: string;
  label: string;
  type: "root" | "object" | "array" | "value";
  value: string;
  path: string;
  position: [number, number, number];
  color: string;
}

interface EdgeData {
  source: [number, number, number];
  target: [number, number, number];
}

interface HudState {
  label: string;
  path: string;
  value: string;
  type: string;
}

// Cinematic Typewriter Effect Component
function TypewriterText({ text, speed = 20 }: { text: string, speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const int = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(int);
    }, speed);
    return () => clearInterval(int);
  }, [text, speed]);

  return <>{displayed}<span className="animate-pulse">_</span></>;
}

// Camera Interpolator for cinematic zoom
function CinematicCamera({ focusPos, isHovering: _isHovering }: { focusPos: THREE.Vector3 | null, isHovering: boolean }) {
  useFrame((state) => {
    if (focusPos) {
      const targetCamPos = focusPos.clone().add(new THREE.Vector3(0, 5, 10));
      state.camera.position.lerp(targetCamPos, 0.05);
      // We don't forcefully lookAt because it fights with OrbitControls if used incorrectly, 
      // but for cinematic click-to-focus it's fine. We'll rely on lerping position.
    }
  });
  return null;
}

function DataNode({ data, setHud, setFocus }: { data: NodeData, setHud: (s: HudState | null) => void, setFocus: (p: THREE.Vector3) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (data.type === "root") {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
        meshRef.current.scale.set(scale, scale, scale);
      }
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const geometryArgs = data.type === "root" ? [2, 4] 
                     : data.type === "object" ? [1, 2] 
                     : data.type === "array" ? [0.8, 1] 
                     : [0.3, 0];

  return (
    <group position={data.position}>
      <mesh 
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); setFocus(new THREE.Vector3(...data.position)); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setHud({ label: data.label, path: data.path, value: data.value, type: data.type }); document.body.style.cursor = 'crosshair'; }}
        onPointerOut={() => { setHovered(false); setHud(null); document.body.style.cursor = 'auto'; }}
      >
        {/* @ts-ignore */}
        <icosahedronGeometry args={geometryArgs} />
        <meshStandardMaterial 
          color={hovered ? "#ffffff" : data.color} 
          wireframe={data.type !== "value" && data.type !== "root"} 
          emissive={data.type === "root" || hovered ? data.color : "#000000"}
          emissiveIntensity={hovered ? 5 : data.type === "root" ? 2 : 0}
          opacity={data.type === "value" ? 0.9 : 1} 
          transparent 
        />
      </mesh>
      {(data.type !== "value" || hovered) && (
        <Text position={[0, geometryArgs[0] * 1.8, 0]} fontSize={hovered ? 0.5 : 0.3} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
          {data.label}
        </Text>
      )}
    </group>
  );
}

export function ThreeJsonGalaxyTool({ providedJson = null }: { providedJson?: any }) {
  const [hasData, setHasData] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [error, setError] = useState("");
  const [hud, setHud] = useState<HudState | null>(null);
  const [focusPos, setFocusPos] = useState<THREE.Vector3 | null>(null);

  const parseJSONToGraph = (obj: any) => {
    const newNodes: NodeData[] = [];
    const newEdges: EdgeData[] = [];
    let idCounter = 0;

    const traverse = (data: any, depth: number, parentPos: [number, number, number] | null, label: string, currentPath: string) => {
      if (idCounter > 1000) return; // WebGL safe limit

      const id = (idCounter++).toString();
      let type: "root" | "object" | "array" | "value" = "value";
      if (depth === 0) type = "root";
      else if (Array.isArray(data)) type = "array";
      else if (typeof data === "object" && data !== null) type = "object";
      
      const valueStr = type === "value" ? String(data) : type === "array" ? `Array(${data.length})` : `Object(${Object.keys(data).length})`;

      const radius = depth === 0 ? 0 : depth * 6 + (Math.random() * 2);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.PI / 2) + (Math.random() * 0.5 - 0.25);
      
      const position: [number, number, number] = depth === 0 ? [0,0,0] : [
        (parentPos ? parentPos[0] : 0) + radius * Math.sin(phi) * Math.cos(theta),
        (parentPos ? parentPos[1] : 0) + radius * Math.cos(phi),
        (parentPos ? parentPos[2] : 0) + radius * Math.sin(phi) * Math.sin(theta),
      ];

      const color = type === "root" ? "#ffaa00" 
                  : type === "object" ? "#00f0FF" 
                  : type === "array" ? "#10B981" 
                  : "#a855f7";
      
      newNodes.push({ id, label: depth === 0 ? "{ ROOT }" : label, type, value: valueStr, path: currentPath || "root", position, color });

      if (parentPos) {
        newEdges.push({ source: parentPos, target: position });
      }

      if (depth < 6 && type !== "value") { 
        const keys = Object.keys(data).slice(0, 20);
        keys.forEach(key => traverse(data[key], depth + 1, position, key, `${currentPath}.${key}`));
      }
    };

    traverse(obj, 0, null, "root", "");
    setNodes(newNodes);
    setEdges(newEdges);
    setHasData(true);
  };

  useEffect(() => {
    if (providedJson) parseJSONToGraph(providedJson);
  }, [providedJson]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target?.result as string);
        parseJSONToGraph(obj);
        setError("");
      } catch {
        setError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 w-full">
      {!hasData ? (
        <div className="card p-12 text-center border-dashed border-2 border-[#00f0FF]/30 bg-black/50 backdrop-blur-md shadow-[0_0_50px_rgba(0,240,255,0.1)] w-full">
          <BoxIcon className="w-20 h-20 text-[#00f0FF] mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#00f0FF] to-[#10B981]">Holographic 3D JSON Galaxy</h2>
          <p className="text-muted max-w-xl mx-auto mb-8 font-mono text-sm">
            INITIALIZING WEBGL SUBSYSTEM... AWAITING JSON PAYLOAD.
          </p>
          {error && <p className="text-danger mb-4 font-bold uppercase tracking-widest">{error}</p>}
          <div className="flex justify-center gap-4">
            <label className="btn bg-[#00f0FF]/10 text-[#00f0FF] hover:bg-[#00f0FF]/20 border border-[#00f0FF]/50 cursor-pointer gap-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <UploadCloudIcon className="w-5 h-5" /> UPLOAD JSON MATRIX
              <input type="file" aria-label="Upload JSON file" accept="application/json" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>
      ) : (
        <div className="h-[80vh] min-h-[600px] w-full rounded-2xl overflow-hidden border border-[#00f0FF]/20 bg-[#020204] relative shadow-[0_0_50px_rgba(0,240,255,0.15)] group">
          
          {/* Cyberpunk HUD Overlay */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 w-80 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-xl p-4 rounded-xl border border-[#00f0FF]/30 text-[#00f0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <div className="flex items-center gap-2 mb-3 border-b border-[#00f0FF]/20 pb-2">
                <Crosshair className="w-4 h-4 animate-[spin_4s_linear_infinite]" />
                <h3 className="font-bold text-xs tracking-widest uppercase">Castov WebGPU Engine</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono opacity-80">
                <div>NODES: <span className="text-white">{nodes.length}</span></div>
                <div>EDGES: <span className="text-white">{edges.length}</span></div>
                <div className="col-span-2 text-[#10B981]">STATUS: STABLE</div>
              </div>
            </div>

            {hud && (
              <div className="bg-black/60 backdrop-blur-xl p-5 rounded-xl border border-[#10B981]/50 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-left-4 duration-200">
                <div className="text-[10px] text-[#00f0FF] mb-2 font-mono break-all uppercase tracking-wider">
                  <TypewriterText text={`PATH: ${hud.path}`} speed={10} />
                </div>
                <div className="font-bold text-xl mb-3 text-[#10B981] flex items-baseline gap-2">
                  {hud.label} <span className="text-[10px] opacity-70 font-mono text-white uppercase border border-white/20 px-1 rounded">{hud.type}</span>
                </div>
                <div className="text-xs font-mono bg-black/50 p-3 rounded-lg overflow-auto max-h-32 text-gray-300 border border-white/10">
                  <TypewriterText text={hud.value} speed={5} />
                </div>
              </div>
            )}
          </div>

          <div className="absolute top-6 right-6 z-10 flex gap-2">
            {!providedJson && (
              <button onClick={() => setHasData(false)} className="bg-black/50 hover:bg-[#00f0FF]/20 text-[#00f0FF] border border-[#00f0FF]/30 px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                DISCONNECT
              </button>
            )}
            <button onClick={() => setFocusPos(null)} className="bg-black/50 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              RESET CAM
            </button>
          </div>
          
          <Canvas camera={{ position: [0, 20, 50], fov: 60 }} dpr={[1, 2]} gl={{ antialias: false }}>
            <color attach="background" args={['#010103']} />
            
            {/* Cinematic Lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 0, 0]} intensity={5} color="#ffaa00" distance={150} decay={2} /> 
            <directionalLight position={[20, 30, 20]} intensity={1.5} color="#00f0FF" />
            
            {/* Deep Space Atmosphere */}
            <Stars radius={200} depth={100} count={10000} factor={5} saturation={1} fade speed={1} />
            <Sparkles count={3000} scale={100} color="#00f0FF" size={2} speed={0.2} opacity={0.3} />
            <Sparkles count={2000} scale={80} color="#10B981" size={3} speed={0.1} opacity={0.2} />

            {/* Post-Processing Pipeline */}
            <EffectComposer>
              <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
            </EffectComposer>
            
            <CinematicCamera focusPos={focusPos} isHovering={!!hud} />

            <group>
              {nodes.map(node => (
                <DataNode key={node.id} data={node} setHud={setHud} setFocus={setFocusPos} />
              ))}
              
              {edges.map((edge, i) => (
                <Line 
                  key={i} 
                  points={[edge.source, edge.target]} 
                  color="#00f0FF" 
                  opacity={0.15} 
                  transparent 
                  lineWidth={1} 
                />
              ))}
            </group>
            
            <OrbitControls autoRotate={!focusPos} autoRotateSpeed={0.5} enableDamping dampingFactor={0.05} maxDistance={300} />
            <Stats className="!absolute !bottom-6 !right-6 !left-auto !top-auto !w-[80px] border border-[#00f0FF]/30 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.2)]" />
          </Canvas>
        </div>
      )}
    </div>
  );
}
