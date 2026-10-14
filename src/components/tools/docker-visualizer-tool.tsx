"use client";

import { useState, useEffect } from "react";
import * as yaml from "js-yaml";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BoxIcon, NetworkIcon, HardDriveIcon } from "lucide-react";

// Custom Service Node for React Flow
const ServiceNode = ({ data }: any) => {
  return (
    <div className="bg-card border border-line rounded-xl shadow-lg w-64 overflow-hidden text-sm">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-accent border-2 border-bg" />
      
      <div className="bg-primary/10 px-4 py-3 border-b border-line flex items-center gap-2">
        <BoxIcon size={18} className="text-primary" />
        <h3 className="font-bold text-fg truncate">{data.name}</h3>
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        {data.image && (
          <div className="flex items-start gap-2">
            <span className="text-muted shrink-0 mt-0.5">Image:</span>
            <span className="font-mono text-xs text-fg break-all">{data.image}</span>
          </div>
        )}
        {data.ports && data.ports.length > 0 && (
          <div className="flex items-start gap-2">
            <NetworkIcon size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span className="font-mono text-[10px] bg-field px-1.5 py-0.5 rounded text-fg border border-line">
              {data.ports.join(", ")}
            </span>
          </div>
        )}
        {data.volumes && data.volumes.length > 0 && (
          <div className="flex items-start gap-2">
            <HardDriveIcon size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-muted line-clamp-2">
              {data.volumes.length} Volume(s)
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-bg" />
    </div>
  );
};

const nodeTypes = {
  serviceNode: ServiceNode,
};

const DEFAULT_YAML = `version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    depends_on:
      - api
      - frontend

  frontend:
    image: my-nextjs-app:1.0
    ports:
      - "3000:3000"
    depends_on:
      - api

  api:
    image: my-node-api:latest
    environment:
      - DB_HOST=db
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
`;

export function DockerVisualizerTool() {
  const [yamlInput, setYamlInput] = useState(DEFAULT_YAML);
  const [error, setError] = useState<string | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    try {
      const parsed = yaml.load(yamlInput) as any;
      if (!parsed || !parsed.services) {
        throw new Error("No 'services' block found in docker-compose.");
      }

      const services = parsed.services;
      const serviceNames = Object.keys(services);
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // A simple grid layout approach
      let row = 0;
      let col = 0;
      const maxCols = 3;

      serviceNames.forEach((name) => {
        const s = services[name];
        
        newNodes.push({
          id: name,
          type: "serviceNode",
          position: { x: col * 350 + 50, y: row * 250 + 50 },
          data: {
            name,
            image: s.image,
            ports: s.ports || [],
            volumes: s.volumes || [],
          },
        });

        // Move cursor
        col++;
        if (col >= maxCols) {
          col = 0;
          row++;
        }

        // Build edges based on depends_on or links
        let depends: string[] = [];
        if (Array.isArray(s.depends_on)) {
          depends = s.depends_on;
        } else if (typeof s.depends_on === 'object' && s.depends_on !== null) {
          depends = Object.keys(s.depends_on); // docker-compose v3 long syntax
        } else if (Array.isArray(s.links)) {
          depends = s.links.map((l: string) => l.split(':')[0]); // 'db:database' -> 'db'
        }

        depends.forEach((dep) => {
          newEdges.push({
            id: `e-${name}-${dep}`,
            source: name,
            target: dep,
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            label: 'depends on',
            labelStyle: { fill: '#a1a1aa', fontWeight: 700, fontSize: 12 },
            labelBgStyle: { fill: '#18181b', stroke: '#27272a' },
          });
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [yamlInput, setNodes, setEdges]);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 h-[800px]">
      {/* Editor Panel */}
      <div className="w-full md:w-1/3 flex flex-col bg-card border border-line rounded-xl shadow-sm overflow-hidden">
        <div className="bg-muted/5 border-b border-line px-4 py-3 flex justify-between items-center">
          <h2 className="font-bold text-fg flex items-center gap-2">
            <BoxIcon size={16} /> docker-compose.yml
          </h2>
          {error ? (
            <span className="text-[10px] text-red-500 font-bold max-w-[120px] truncate" title={error}>Error</span>
          ) : (
            <span className="text-[10px] text-emerald-500 font-bold">Valid</span>
          )}
        </div>
        <textarea
          value={yamlInput}
          onChange={(e) => setYamlInput(e.target.value)}
          aria-label="Docker Compose YAML"
          className="flex-1 w-full bg-transparent p-4 font-mono text-xs focus:outline-none resize-none"
          spellCheck={false}
          placeholder="Paste docker-compose.yml here..."
        />
        {error && (
          <div className="bg-red-500/10 border-t border-red-500/20 p-3 text-xs font-mono text-red-400 overflow-y-auto max-h-32">
            {error}
          </div>
        )}
      </div>

      {/* Canvas Panel */}
      <div className="w-full md:w-2/3 bg-bg border border-line rounded-xl shadow-inner relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgba(255,255,255,0.05)" />
          <Controls className="bg-card border-line fill-fg text-fg" />
          <MiniMap nodeStrokeWidth={3} className="bg-card" nodeColor="#3f3f46" maskColor="rgba(0,0,0,0.2)" />
        </ReactFlow>
      </div>
    </div>
  );
}
