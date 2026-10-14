"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as Y from "yjs";
// @ts-ignore
import { WebrtcProvider } from "y-webrtc";
import { Users } from "lucide-react";

import { InputNode, JsonNode, OutputNode, Base64EncodeNode, Base64DecodeNode, RegexNode } from "./nodes/CanvasNodes";

const nodeTypes = {
  inputNode: InputNode,
  jsonNode: JsonNode,
  outputNode: OutputNode,
  base64EncodeNode: Base64EncodeNode,
  base64DecodeNode: Base64DecodeNode,
  regexNode: RegexNode,
};

const initialNodes: Node[] = [
  { id: "node-input-1", type: "inputNode", position: { x: 50, y: 150 }, data: { value: 'user_email: dev@example.com\nsecret_token: c29tZSBzZWNyZXQgdGV4dA==' } },
  { id: "node-regex-1", type: "regexNode", position: { x: 400, y: 50 }, data: { value: null, pattern: '[a-zA-Z0-9+/]{20,}={0,2}', error: false } },
  { id: "node-base64-decode", type: "base64DecodeNode", position: { x: 750, y: 50 }, data: { value: null, error: false } },
  { id: "node-output-1", type: "outputNode", position: { x: 1100, y: 150 }, data: { value: "" } },
];

const initialEdges: Edge[] = [
  { id: "e-in-reg", source: "node-input-1", target: "node-regex-1", animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
  { id: "e-reg-b64", source: "node-regex-1", target: "node-base64-decode", animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
  { id: "e-b64-out", source: "node-base64-decode", target: "node-output-1", animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
];

export default function DevCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [peers, setPeers] = useState(1);
  const [connected, setConnected] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<any>(null);
  const yNodesMap = useRef<Y.Map<Node> | null>(null);
  const yEdgesMap = useRef<Y.Map<Edge> | null>(null);
  const isUpdatingYjs = useRef(false);

  // Setup WebRTC and CRDTs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const roomName = "castov-canvas-p2p-" + (window.location.hash || "global");
    
    // We connect to a public signaling server for demo purposes.
    const provider = new WebrtcProvider(roomName, ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    });
    providerRef.current = provider;

    provider.on('synced', (state: { synced: boolean }) => {
      setConnected(state.synced);
    });

    provider.awareness.on('change', () => {
      setPeers(Array.from(provider.awareness.getStates().keys()).length);
    });

    const yNodes = ydoc.getMap<Node>('nodes');
    const yEdges = ydoc.getMap<Edge>('edges');
    yNodesMap.current = yNodes;
    yEdgesMap.current = yEdges;

    // Listen to remote changes
    yNodes.observe(() => {
      if (isUpdatingYjs.current) return;
      const remoteNodes = Array.from(yNodes.values());
      if (remoteNodes.length > 0) {
        setNodes(remoteNodes);
      }
    });

    yEdges.observe(() => {
      if (isUpdatingYjs.current) return;
      const remoteEdges = Array.from(yEdges.values());
      if (remoteEdges.length > 0) {
        setEdges(remoteEdges);
      }
    });

    // Populate initial state if empty
    if (yNodes.keys().next().done) {
      isUpdatingYjs.current = true;
      ydoc.transact(() => {
        initialNodes.forEach(n => yNodes.set(n.id, n));
        initialEdges.forEach(e => yEdges.set(e.id, e));
      });
      isUpdatingYjs.current = false;
    } else {
      setNodes(Array.from(yNodes.values()));
      setEdges(Array.from(yEdges.values()));
    }

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, []);

  // Update Yjs when local nodes change
  const syncNodesToYjs = useCallback((newNodes: Node[]) => {
    if (!yNodesMap.current || !ydocRef.current) return;
    isUpdatingYjs.current = true;
    ydocRef.current.transact(() => {
      newNodes.forEach(n => yNodesMap.current!.set(n.id, n));
    });
    isUpdatingYjs.current = false;
  }, []);

  const syncEdgesToYjs = useCallback((newEdges: Edge[]) => {
    if (!yEdgesMap.current || !ydocRef.current) return;
    isUpdatingYjs.current = true;
    ydocRef.current.transact(() => {
      newEdges.forEach(e => yEdgesMap.current!.set(e.id, e));
    });
    isUpdatingYjs.current = false;
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        syncNodesToYjs(next);
        return next;
      });
    },
    [syncNodesToYjs]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        syncEdgesToYjs(next);
        return next;
      });
    },
    [syncEdgesToYjs]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const next = addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, eds);
        syncEdgesToYjs(next);
        return next;
      });
    },
    [syncEdgesToYjs]
  );

  // Hook input changes up
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === "inputNode") {
          return {
            ...n,
            data: {
              ...n.data,
              onChange: (val: string) => {
                setNodes((currentNds) => {
                  const next = currentNds.map((cn) => cn.id === n.id ? { ...cn, data: { ...cn.data, value: val } } : cn);
                  syncNodesToYjs(next);
                  return next;
                });
              },
            },
          };
        }
        if (n.type === "regexNode") {
          return {
            ...n,
            data: {
              ...n.data,
              onPatternChange: (val: string) => {
                setNodes((currentNds) => {
                  const next = currentNds.map((cn) => cn.id === n.id ? { ...cn, data: { ...cn.data, pattern: val } } : cn);
                  syncNodesToYjs(next);
                  return next;
                });
              },
            }
          }
        }
        return n;
      })
    );
  }, [syncNodesToYjs]);

  // Data Propagation Loop
  useEffect(() => {
    let changed = false;
    const newNodes = nodes.map((node) => {
      const incomingEdges = edges.filter((e) => e.target === node.id);
      if (incomingEdges.length === 0) return node;

      const sourceNode = nodes.find((n) => n.id === incomingEdges[0].source);
      if (!sourceNode) return node;

      const sourceVal = sourceNode.data.value;

      if (node.type === "jsonNode") {
        try {
          if (typeof sourceVal === 'string' && sourceVal.trim().length > 0) {
            const parsed = JSON.parse(sourceVal);
            const formatted = JSON.stringify(parsed, null, 2);
            if (node.data.value !== formatted) {
              changed = true;
              return { ...node, data: { ...node.data, value: formatted, error: false } };
            }
          } else {
            if (node.data.value !== "") {
              changed = true;
              return { ...node, data: { ...node.data, value: "", error: false } };
            }
          }
        } catch {
          if (!node.data.error) {
            changed = true;
            return { ...node, data: { ...node.data, value: "Invalid JSON", error: true } };
          }
        }
      }

      if (node.type === "base64EncodeNode") {
        try {
          if (typeof sourceVal === 'string') {
            const encoded = btoa(sourceVal);
            if (node.data.value !== encoded) {
              changed = true;
              return { ...node, data: { ...node.data, value: encoded, error: false } };
            }
          }
        } catch {
          if (!node.data.error) { changed = true; return { ...node, data: { ...node.data, value: "", error: true } }; }
        }
      }

      if (node.type === "base64DecodeNode") {
        try {
          if (typeof sourceVal === 'string') {
            const decoded = atob(sourceVal);
            if (node.data.value !== decoded) {
              changed = true;
              return { ...node, data: { ...node.data, value: decoded, error: false } };
            }
          }
        } catch {
          if (!node.data.error) { changed = true; return { ...node, data: { ...node.data, value: "Invalid Base64", error: true } }; }
        }
      }

      if (node.type === "regexNode") {
        try {
          if (typeof sourceVal === 'string' && typeof node.data.pattern === 'string' && node.data.pattern) {
            const re = new RegExp(node.data.pattern, 'g');
            const matches = [...sourceVal.matchAll(re)].map(m => m[0]);
            const formatted = matches.join('\n');
            if (node.data.value !== formatted) {
              changed = true;
              return { ...node, data: { ...node.data, value: formatted, error: false } };
            }
          } else {
             if (node.data.value !== "") { changed = true; return { ...node, data: { ...node.data, value: "", error: false } }; }
          }
        } catch {
          if (!node.data.error) { changed = true; return { ...node, data: { ...node.data, value: "Invalid Regex", error: true } }; }
        }
      }

      if (node.type === "outputNode") {
        if (node.data.value !== sourceVal) {
          changed = true;
          return { ...node, data: { ...node.data, value: sourceVal } };
        }
      }

      return node;
    });

    if (changed) {
      setNodes(newNodes);
      syncNodesToYjs(newNodes);
    }
  }, [nodes, edges, syncNodesToYjs]);

  return (
    <div className="relative w-full h-full">
      {/* P2P Status Indicator */}
      <div className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur border border-line rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
        <Users className="w-4 h-4 text-muted" />
        <div className="text-xs font-semibold">
          {peers > 1 ? (
            <span className="text-success">{peers} Peers Connected (P2P)</span>
          ) : (
            <span className="text-muted">Waiting for peers...</span>
          )}
        </div>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-warning animate-pulse'}`} />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-bg"
      >
        <Controls className="bg-card border-line fill-fg text-fg" />
        <MiniMap nodeStrokeWidth={3} className="bg-card" nodeColor="#3f3f46" maskColor="rgba(0,0,0,0.2)" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="rgba(255,255,255,0.1)" />
      </ReactFlow>
    </div>
  );
}
