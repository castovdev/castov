"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, Check, ServerCrash } from "lucide-react";

export function FetchMockGeneratorTool() {
  const [routes, setRoutes] = useState([{ method: "GET", path: "/api/users", response: '{\n  "status": "success",\n  "data": []\n}', delay: 500 }]);
  const [copied, setCopied] = useState(false);

  const addRoute = () => setRoutes([...routes, { method: "GET", path: "/api/new", response: "{}", delay: 0 }]);
  
  const updateRoute = (index: number, field: string, value: any) => {
    const newRoutes = [...routes];
    newRoutes[index] = { ...newRoutes[index], [field]: value };
    setRoutes(newRoutes);
  };

  const removeRoute = (index: number) => {
    setRoutes(routes.filter((_, i) => i !== index));
  };

  const generatedCode = `
// Paste this in your browser console or top-level React/Next.js layout
(function() {
  const originalFetch = window.fetch;
  const mockRoutes = ${JSON.stringify(routes, null, 2)};

  window.fetch = async function(url, options) {
    const method = (options?.method || 'GET').toUpperCase();
    const routeUrl = typeof url === 'string' ? url : url.url;
    
    const matchedMock = mockRoutes.find(r => 
      routeUrl.includes(r.path) && r.method === method
    );

    if (matchedMock) {
      console.log(\`%c[Castov Mock Server] Intercepted \${method} \${matchedMock.path}\`, 'color: #8b5cf6; font-weight: bold;');
      
      if (matchedMock.delay > 0) {
        await new Promise(res => setTimeout(res, matchedMock.delay));
      }

      return new Response(matchedMock.response, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch.apply(this, arguments);
  };
  
  console.log("%c[Castov Mock Server] Installed and listening for fetch requests!", "color: #10b981; font-weight: bold; font-size: 14px;");
})();
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-sm text-accent mb-8">
        <ServerCrash className="w-8 h-8 mb-4" />
        <p className="font-semibold text-lg mb-2">Service Worker API Mocker (Local-First)</p>
        <p>Define your mock API routes below. We will generate a secure, dependency-free Monkey-patch script that intercepts <code className="bg-bg/50 px-1 rounded">window.fetch</code> in your app. 100% Zero-Server. No Node.js backend required.</p>
      </div>

      <div className="space-y-4">
        {routes.map((route, i) => (
          <div key={i} className="card p-4 border border-line bg-card relative">
            <button onClick={() => removeRoute(i)} aria-label="Remove mock route" className="absolute top-4 right-4 text-muted hover:text-danger">
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-[100px_1fr_120px] gap-4 mb-4 pr-8">
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">Method</label>
                <select 
                  aria-label="HTTP Method"
                  value={route.method} 
                  onChange={(e) => updateRoute(i, 'method', e.target.value)}
                  className="w-full bg-field border border-line rounded-lg px-3 py-2 text-sm"
                >
                  <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">Path (Partial Match)</label>
                <input 
                  type="text" 
                  aria-label="Path (Partial Match)"
                  value={route.path} 
                  onChange={(e) => updateRoute(i, 'path', e.target.value)}
                  className="w-full bg-field border border-line rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="/api/v1/..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">Delay (ms)</label>
                <input 
                  type="number" 
                  aria-label="Delay (ms)"
                  value={route.delay} 
                  onChange={(e) => updateRoute(i, 'delay', parseInt(e.target.value) || 0)}
                  className="w-full bg-field border border-line rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">JSON Response</label>
              <textarea 
                aria-label="JSON Response"
                value={route.response}
                onChange={(e) => updateRoute(i, 'response', e.target.value)}
                className="w-full bg-[#050505] border border-line rounded-lg px-4 py-3 text-sm font-mono h-32 resize-none"
              />
            </div>
          </div>
        ))}

        <button onClick={addRoute} className="btn btn-secondary w-full justify-center border-dashed border-2 py-4">
          <Plus className="w-5 h-5 mr-2" /> Add Mock Route
        </button>
      </div>

      <div className="mt-8 pt-8 border-t border-line">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-fg">Generated Injection Script</h2>
          <button onClick={handleCopy} className="btn bg-accent text-white hover:bg-accent-hover text-sm">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy Script"}
          </button>
        </div>
        <pre className="bg-[#050505] border border-line rounded-xl p-4 overflow-x-auto text-sm font-mono text-fg">
          <code>{generatedCode}</code>
        </pre>
      </div>
    </div>
  );
}
