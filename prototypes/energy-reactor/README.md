# Energy reactor study

This prototype is a standalone Vite development page. It shares the project's installed Three.js dependencies and has no import from the portfolio entry point.

## Generate the model

From the React project root, with Blender available on PATH (export verified with Blender 5.3.0):

```powershell
blender --background --python-exit-code 1 --python ./prototypes/energy-reactor/generate_reactor.py -- --output ./prototypes/energy-reactor/reactor.glb
```

When Blender is installed in its standard Windows directory and isn't on PATH, use its executable directly:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background --python-exit-code 1 --python ./prototypes/energy-reactor/generate_reactor.py -- --output ./prototypes/energy-reactor/reactor.glb
```

Substitute your install path if it differs. The script starts from an empty Blender scene and writes the GLB without saving a `.blend` file. To inspect the generated geometry in Blender, import the GLB through **File → Import → glTF 2.0**.

## Review in the browser

1. Run `npm run dev` from the React project root.
2. Open `http://localhost:5173/prototypes/energy-reactor/`. Use the port Vite prints if it chooses another.
3. Drag to orbit, scroll or pinch to zoom, and use **Reset camera** to return to the studio framing. **Pause motion** leaves the camera interactive. Reduced motion keeps the model still by default.

A fresh export belongs beside `index.html`. If the preview was open when the file was exported, reload it. Without an export, the page shows the generation instructions and makes no GLB request.

## Model hierarchy

- `LevitationRoot` carries the floating assembly while `DockBase` stays fixed.
- `OuterSculpture` holds three sculpted obsidian blades with copper and inset energy strips.
- `InnerGlass` holds two smoked-glass vanes.
- `CrystalCore` holds the amber shell and `EnergyElements`, which contains the luminous crystal and fracture geometry.
- `DockRotatingRing` carries the moving instrumentation ring.

The browser drives the motion and studio lighting. The standalone preview remains development-only.
