"""Export the V3 reactor without changing the V2 generator or asset."""

import argparse
import math
from pathlib import Path
import runpy
import sys

import bpy


ROOT = Path(__file__).resolve().parent
v2 = runpy.run_path(str(ROOT.parent / "generate_reactor.py"))
TAU = math.tau


def build():
    v2["build"]()
    material, palette = v2["material"], v2["palette"]
    empty, sweep, ring = v2["empty"], v2["swept_ribbon"], v2["ring"]
    outer = bpy.data.objects["OuterSculpture"]
    for blade in list(outer.children):
        bpy.data.objects.remove(blade, do_unlink=True)

    metal = material("V3 brushed titanium", palette("424653"), metallic=0.94,
                     roughness=0.31, coat=0.13, anisotropy=0.52)
    obsidian = bpy.data.materials["Obsidian titanium"]
    copper = bpy.data.materials["Brushed copper"]
    copper.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.39
    bezel = material("V3 satin copper bezel", palette("956044"), metallic=0.73, roughness=0.53, anisotropy=0.26)
    bpy.data.objects["FixedBrushedBezel"].data.materials[0] = bezel
    inlay = material("V3 orbital energy inlay", palette("FF5723"), roughness=0.29, emission=1.25)
    well = material("V3 well conductor", palette("FF732E"), roughness=0.33, emission=1.5)
    vent = material("V3 vent glow", palette("FF6930"), roughness=0.43, emission=0.68)
    emission = bpy.data.materials["Molten light"].node_tree.nodes.get("Principled BSDF")
    emission.inputs["Emission Color"].default_value = (*palette("FF9F58"), 1)
    emission.inputs["Emission Strength"].default_value = 2.7

    for index, (radius, width, phase, rise, angle) in enumerate([
        (0.80, 0.21, 0.38, 0.44, 0.34),
        (1.15, 0.27, 2.56, -0.62, -0.31),
        (1.52, 0.32, 4.21, 0.80, 0.56),
    ], 1):
        axis = empty(f"OrbitAxis_{index}", outer)
        axis.rotation_euler = (angle, angle * 0.44, phase * 0.22)
        orbit = empty(f"OrbitalRing_{index}", axis)
        sweep(f"OrbitalBlade_{index}", orbit, metal if index == 2 else obsidian,
              phase=phase, sweep=math.radians(281 - 6 * index), radius=radius,
              width=width, thickness=0.14 + index * 0.018, rise=rise,
              roll=0.42 if index % 2 else -0.38, wave=0.08,
              inset_materials=(copper, inlay))

    dock = bpy.data.objects["DockBase"]
    reactor_lights = empty("DockEnergyV3", dock)
    ring("InnerWellTrace", reactor_lights, well, [(0.30, .407), (0.312, .419), (0.326, .419), (0.34, .407)])
    ring("OuterWellTrace", reactor_lights, well, [(0.55, .402), (0.56, .412), (0.574, .412), (0.584, .402)])
    ring("ExternalMachinedFlange", dock, obsidian, [(1.43, .22), (1.44, .233), (1.57, .233), (1.59, .21)])
    for index in range(8):
        a = index * TAU / 8 + 0.031
        bpy.ops.mesh.primitive_cube_add(size=1, location=(1.544 * math.cos(a), 1.544 * math.sin(a), .265))
        light = v2["finish"](bpy.context.object, f"VentEmitter_{index + 1}", reactor_lights, vent, 0.06)
        light.scale = (0.017, 0.041, 0.024)
        light.rotation_euler.z = a


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "reactor-v3.glb")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    build()
    bpy.ops.export_scene.gltf(
        filepath=str(args.output.resolve()), export_format="GLB", export_yup=True,
        export_apply=True, export_tangents=True, export_animations=False,
    )


if __name__ == "__main__":
    main()
