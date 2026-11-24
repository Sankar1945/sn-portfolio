"""Generate the sculptural reactor and export a standalone glTF 2.0 binary."""

import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


TAU = math.tau
CENTRE = (0, 0, 1.84)


def material(name, color, *, metallic=0, roughness=0.3, coat=0, transmission=0, emission=0, anisotropy=0):
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:
        mat.use_nodes = True
    mat.diffuse_color = (*color, 1)
    mat.use_backface_culling = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    for label, value in {
        "Base Color": (*color, 1),
        "Metallic": metallic,
        "Roughness": roughness,
        "Coat Weight": coat,
        "Transmission Weight": transmission,
        "IOR": 1.46,
        "Emission Color": (*color, 1),
        "Emission Strength": emission,
    }.items():
        shader.inputs[label].default_value = value
    anisotropic_socket = shader.inputs.get("Anisotropic")
    if anisotropic_socket is None:
        anisotropic_socket = shader.inputs.get("Anisotropic IOR Level")
    if anisotropic_socket is not None:
        anisotropic_socket.default_value = anisotropy
    return mat


def empty(name, parent=None, location=(0, 0, 0)):
    node = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(node)
    node.parent = parent
    node.location = location
    return node


def finish(obj, name, parent, mat, bevel=0, smooth=True):
    obj.name = name
    obj.parent = parent
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = smooth
    if bevel:
        edges = obj.modifiers.new("Machined edge", "BEVEL")
        edges.width = bevel
        edges.segments = 3
        normal = obj.modifiers.new("Weighted face normals", "WEIGHTED_NORMAL")
        normal.keep_sharp = True
    return obj


def swept_ribbon(name, parent, mat, *, phase, sweep, radius, width, thickness,
                 rise, roll, glass=False, wave=0.12, inset_materials=()):
    """Sweep a rounded rectangular section along an open helical spline."""
    steps, sides = (96, 32) if inset_materials else (56, 16)
    vertices, faces = [], []
    for i in range(steps + 1):
        t = i / steps
        theta = phase + sweep * t
        radial = Vector((math.cos(theta), math.sin(theta), 0))
        tangent = Vector((-math.sin(theta), math.cos(theta), 0))
        track_radius = radius + 0.12 * math.sin(math.pi * t)
        z = rise * (t - 0.5) + wave * math.sin(TAU * t)
        centre = track_radius * radial + Vector((0, 0, z))
        twist = roll + 0.55 * math.sin(TAU * t - 0.65)
        u = math.cos(twist) * radial + Vector((0, 0, math.sin(twist)))
        direction = (
            0.12 * math.pi * math.cos(math.pi * t) * radial
            + sweep * track_radius * tangent
            + Vector((0, 0, rise + TAU * wave * math.cos(TAU * t)))
        ).normalized()
        u = (u - direction * u.dot(direction)).normalized()
        v = u.cross(direction).normalized()
        taper = 0.09 + 0.91 * math.sin(math.pi * t) ** 0.72
        if inset_materials:
            taper *= 1.0 + 0.22 * math.sin(math.pi * t * 1.65)
        for j in range(sides):
            angle = TAU * j / sides
            c, s = math.cos(angle), math.sin(angle)
            exponent = 0.76 if glass else 0.65
            a = math.copysign(abs(c) ** exponent, c)
            b = math.copysign(abs(s) ** exponent, s)
            depth = thickness * (0.35 + 0.65 * taper)
            if inset_materials:
                channel = max(0, 1 - abs(j - 13) / 3)
                depth *= 1 - 0.11 * channel * channel
            point = centre + (a * u * width * taper + b * v * depth) * 0.5
            vertices.append(tuple(point))
    for i in range(steps):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple(steps * sides + j for j in range(sides)))
    mesh = bpy.data.meshes.new(name + "_Surface")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name="Brushing direction")
    for face in mesh.polygons:
        for loop in face.loop_indices:
            i, j = divmod(mesh.loops[loop].vertex_index, sides)
            if j == 0 and face.index % sides == sides - 1:
                j = sides
            uv.data[loop].uv = (i / steps, j / sides)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, name, parent, mat)
    for detail in inset_materials:
        mesh.materials.append(detail)
    if inset_materials:
        for face in list(mesh.polygons)[:steps * sides]:
            row, side = divmod(face.index, sides)
            if 9 < row < steps - 10 and side == 13:
                face.material_index = 2
            elif side in (11, 12, 13, 14, 15, 16):
                face.material_index = 1
    # The sweep uses a consistent frame; recalculate the two caps and outer normals.
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.triangulate(bm, faces=[face for face in bm.faces if len(face.verts) > 4])
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    return obj


def cylinder(name, parent, mat, radius, depth, z, bevel):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=radius, depth=depth, location=(0, 0, z))
    obj = finish(bpy.context.object, name, parent, mat, bevel)
    triangulation = obj.modifiers.new("Triangulate caps for GLB tangents", "TRIANGULATE")
    triangulation.min_vertices = 5
    triangulation.keep_custom_normals = True
    return obj


def palette(hex_value):
    color = [int(hex_value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in color)


def mesh_object(name, parent, mat, vertices, faces, *, smooth=False):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, parent, mat, smooth=smooth)


def crystal(name, parent, mat, radius, height):
    # Planar body facets and truncated tips keep the crystal angular without
    # the abrupt twists and skinny diagonals of the previous diamond mesh.
    segments = 8
    profile = [(-1.0, 0.12), (-0.37, 0.86), (0.29, 1.0), (1.0, 0.12)]
    vertices = [(radius * factor * math.cos(TAU * index / segments + math.pi / 8),
                 radius * factor * math.sin(TAU * index / segments + math.pi / 8),
                 height * level)
                for level, factor in profile for index in range(segments)]
    faces = [tuple(reversed(range(segments)))]
    for row in range(len(profile) - 1):
        for i in range(segments):
            a = row * segments + i
            b = row * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple(range((len(profile) - 1) * segments, len(profile) * segments)))
    return mesh_object(name, parent, mat, vertices, faces)


def fracture(name, parent, mat, points):
    curve = bpy.data.curves.new(name + "_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.011
    curve.bevel_resolution = 1
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for index, (point, position) in enumerate(zip(spline.points, points)):
        point.co = (*position, 1)
        point.radius = 0.4 if index in (0, len(points) - 1) else 1
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    curve.materials.append(mat)


def ring(name, parent, mat, profile):
    segments = 96
    vertices = [(r * math.cos(TAU * i / segments), r * math.sin(TAU * i / segments), z)
                for r, z in profile for i in range(segments)]
    faces = []
    for row in range(len(profile)):
        end = (row + 1) % len(profile)
        for i in range(segments):
            j = (i + 1) % segments
            faces.append((row * segments + i, end * segments + i, end * segments + j, row * segments + j))
    return mesh_object(name, parent, mat, vertices, faces, smooth=True)


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    obsidian = material("Obsidian titanium", palette("303642"), metallic=0.95,
                        roughness=0.33, anisotropy=0.43, coat=0.08)
    copper = material("Brushed copper", palette("A46B49"), metallic=0.85, roughness=0.28, anisotropy=0.42)
    graphite = material("Machined graphite", palette("171921"), metallic=0.77, roughness=0.36)
    dark = material("Vent slots", palette("080A0F"), metallic=0.27, roughness=0.47)
    glass = material("Smoked warm glass", palette("876B64"), roughness=0.17, coat=0.25, transmission=0.89)
    crystal_glass = material("Amber crystal shell", palette("FFAD73"), roughness=0.16, coat=0.17, transmission=0.88)
    core_light = material("Molten light", palette("FF793F"), roughness=0.32, emission=1.55)
    hot = material("Fracture highlights", palette("FFD2A0"), roughness=0.31, emission=1.10)
    dock_light = material("Low orange instrumentation", palette("EE6338"), roughness=0.31, emission=0.86)

    root = empty("EnergyReactor")
    floating = empty("LevitationRoot", root, CENTRE)
    outer = empty("OuterSculpture", floating)
    inner = empty("InnerGlass", floating)
    core = empty("CrystalCore", floating)
    dock = empty("DockBase", root)
    rotor = empty("DockRotatingRing", dock)
    energy = empty("EnergyElements", core)

    for i in range(3):
        swept_ribbon(f"ObsidianBlade_{i + 1}", outer, obsidian,
                     phase=i * TAU / 3 + 0.16, sweep=math.radians(165), radius=1.05,
                     width=0.56, thickness=0.24, rise=1.62, roll=0.65, wave=0.16,
                     inset_materials=(copper, dock_light))
    for i in range(2):
        swept_ribbon(f"SmokedVane_{i + 1}", inner, glass, phase=0.72 + i * math.pi,
                     sweep=math.radians(125), radius=0.66, width=0.26,
                     thickness=0.11, rise=-0.92, roll=-0.48, glass=True)
    crystal("AmberFacetedShell", core, crystal_glass, 0.44, 0.82)
    crystal("LuminousInnerCrystal", energy, core_light, 0.186, 0.52)
    for i in range(5):
        angle = i * TAU / 5
        path = [(r * math.cos(angle + spin), r * math.sin(angle + spin), z)
                for r, spin, z in [(0.105, 0, -0.43), (0.225, 0.21, -0.17), (0.205, -0.19, 0.02),
                                   (0.24, 0.25, 0.25), (0.111, -0.13, 0.48)]]
        fracture(f"EnergyFracture_{i + 1}", energy, hot, path)

    cylinder("DockFoundation", dock, graphite, 1.55, 0.14, 0.10, 0.028)
    cylinder("CopperSeam", dock, copper, 1.56, 0.033, 0.172, 0.008)
    cylinder("ObsidianHousing", dock, obsidian, 1.53, 0.19, 0.27, 0.038)
    cylinder("RecessedWell", dock, graphite, 1.05, 0.09, 0.349, 0.021)
    ring("FixedBrushedBezel", dock, copper, [(1.36, .345), (1.39, .386), (1.48, .393), (1.51, .353)])
    ring("SuspendedMachinedRing", rotor, graphite, [(0.84, .355), (0.87, .418), (1.27, .418), (1.30, .37)])
    ring("WellCollar", dock, copper, [(0.60, .361), (0.64, .390), (0.72, .385), (0.74, .355)])
    cylinder("RecessedWellFloor", dock, graphite, 0.57, 0.012, 0.395, 0.004)
    ring("LevitationEmitter", dock, dock_light, [(0.40, .398), (0.42, .404), (0.50, .404), (0.52, .398)])
    cylinder("WellAperture", dock, dark, 0.38, 0.01, 0.397, 0.004)
    for i in range(8):
        angle = i * TAU / 8
        channel = swept_ribbon(f"RecessedChannel_{i + 1}", rotor, dock_light, phase=angle + 0.1,
                               sweep=0.48, radius=0.99, width=0.065, thickness=0.025,
                               rise=0, roll=0, wave=0)
        channel.location.z = 0.411
        for j in range(2):
            a = angle + 0.062 * j
            bpy.ops.mesh.primitive_cube_add(size=1, location=(1.522 * math.cos(a), 1.522 * math.sin(a), .263))
            slot = finish(bpy.context.object, f"Vent_{i + 1}_{j + 1}", dock, dark, smooth=False)
            slot.scale = (0.021, 0.048, 0.076)
            slot.rotation_euler.z = a


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default=str(Path(__file__).with_name("reactor.glb")))
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    build()
    bpy.ops.export_scene.gltf(
        filepath=str(output), export_format="GLB", export_yup=True, export_apply=True,
        export_animations=False, export_tangents=True,
    )
    print(f"Exported {output}")


if __name__ == "__main__":
    main()
