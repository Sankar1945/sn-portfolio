# Energy Reactor V3

V3 is an isolated development preview. The existing V2 page and the model and renderer used by Skills are separate.

From the React project root, install the V3-only effects package and start Vite.

```powershell
npm ci --prefix ./prototypes/energy-reactor/v3 --legacy-peer-deps
npm run dev
```

Open http://localhost:5173/prototypes/energy-reactor/v3/ using the port Vite prints. V2 remains available at http://localhost:5173/prototypes/energy-reactor/.

The exported `reactor-v3.glb` is included. To rebuild it in Blender 5.3:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background --python-exit-code 1 --python ./prototypes/energy-reactor/v3/generate_reactor_v3.py
```

Drag to orbit, scroll or pinch to zoom, and use the existing pause and reset controls. The renderer pauses continuous updates when the tab is hidden or reduced motion is enabled.
