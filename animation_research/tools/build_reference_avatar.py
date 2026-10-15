"""Create an editable stylized badminton avatar from our existing M1 armature.

The reference image guides the silhouette and palette; all geometry is newly
authored here. The browser game renders a matching procedural avatar so its
existing contact pose and footwork remain driven by the gameplay simulation.
"""
from pathlib import Path
import math

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "04_blender" / "m1_split_smash_rig.blend"
BLEND = ROOT / "04_blender" / "sa3d_stylized_avatar_v1.blend"
GLB = ROOT / "05_exports" / "sa3d_stylized_avatar_v1.glb"
PREVIEW = ROOT / "06_qc" / "sa3d_stylized_avatar_v1.png"

bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
arm = bpy.data.objects["SA3D_HumanoidRig"]


def material(name, color, roughness=0.62):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.roughness = roughness
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1)
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


skin = material("Avatar_Skin_Peach", (.97, .67, .47), .78)
shirt = material("Avatar_Shirt_Cyan", (.015, .53, .74))
lime = material("Avatar_Trim_Lime", (.56, .93, .14))
red = material("Avatar_Trim_Coral", (.92, .20, .17))
navy = material("Avatar_Shorts_Navy", (.016, .055, .12))
hair = material("Avatar_Hair_Deep_Blue", (.025, .12, .22))
cyan = material("Avatar_Hair_Cyan", (.015, .77, .94))
white = material("Avatar_White", (.96, .97, .92))
brown = material("Avatar_Iris_Brown", (.23, .10, .05), .34)
black = material("Avatar_Pupil", (.012, .009, .015), .25)
shoe_cyan = material("Avatar_Shoe_Cyan", (.05, .49, .70))


def replace_mat(name, mat):
    obj = bpy.data.objects[name]
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


for name in ("Body_Neck", "Arm_Fore_L", "Arm_Fore_R", "Hand_L", "Hand_R",
             "Leg_Shin_L", "Leg_Shin_R"):
    replace_mat(name, skin)
for name in ("Body_Abdomen", "Body_Chest", "Arm_Upper_L", "Arm_Upper_R"):
    replace_mat(name, shirt)
for name in ("Body_Pelvis", "Leg_Thigh_L", "Leg_Thigh_R"):
    replace_mat(name, navy)
for name in ("Foot_L", "Foot_R"):
    replace_mat(name, white)
for name in ("Racket_Frame", "Racket_Shaft"):
    replace_mat(name, red)

bpy.data.objects.remove(bpy.data.objects["Body_Head"], do_unlink=True)


def skin_to_bone(obj, bone):
    group = obj.vertex_groups.new(name=bone)
    group.add(range(len(obj.data.vertices)), 1, "REPLACE")
    modifier = obj.modifiers.new("Armature", "ARMATURE")
    modifier.object = arm
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    return obj


def oval(name, loc, scale, mat, bone, rotation=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if rotation:
        obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    return skin_to_bone(obj, bone)


def lock(name, start, end, radius, mat):
    direction = Vector(end) - Vector(start)
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=20, ring_count=12, location=(Vector(start) + Vector(end)) / 2
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.rotation_mode = "QUATERNION"
    obj.scale = (radius, radius * .80, direction.length * .70)
    obj.data.materials.append(mat)
    return skin_to_bone(obj, "head")


# Blender's character faces -Y. The game-facing procedural version uses -Z.
oval("Face_Head", (0, 0, 1.80), (.265, .247, .27), skin, "head")
oval("Hair_Cap", (0, .045, 1.98), (.274, .235, .148), hair, "head")
for sign, suffix in ((-1, "L"), (1, "R")):
    oval(f"Ear_{suffix}", (sign * .265, 0, 1.79), (.062, .050, .083), skin, "head")
    oval(f"Eye_White_{suffix}", (sign * .105, -.234, 1.825), (.075, .029, .090), white, "head")
    oval(f"Eye_Iris_{suffix}", (sign * .106, -.262, 1.820), (.042, .017, .052), brown, "head")
    oval(f"Eye_Pupil_{suffix}", (sign * .106, -.279, 1.825), (.025, .009, .030), black, "head")
    oval(f"Eye_Glint_{suffix}", (sign * .094, -.288, 1.85), (.012, .006, .014), white, "head")
    oval(f"Brow_{suffix}", (sign * .107, -.238, 1.925), (.075, .016, .023), hair, "head")
    oval(f"Shirt_Side_{suffix}", (sign * .205, -.035, 1.32), (.045, .10, .18), lime, "chest")
    oval(f"Shoulder_Lime_{suffix}", (sign * .23, 0, 1.52), (.080, .12, .042), lime, "chest")
    oval(f"Sleeve_Coral_{suffix}", (sign * .48, -.005, 1.43), (.055, .078, .052), red, f"upper_arm.{suffix}")
    oval(f"Shoe_Cyan_{suffix}", (sign * .14, -.09, .17), (.10, .15, .045), shoe_cyan, f"foot.{suffix}")
    oval(f"Shoe_Lime_{suffix}", (sign * .14, -.18, .15), (.065, .06, .032), lime, f"foot.{suffix}")

oval("Nose", (0, -.255, 1.765), (.025, .021, .026), skin, "head")
oval("Smile", (0, -.242, 1.709), (.065, .011, .012), red, "head")
oval("Collar_Coral", (0, -.004, 1.58), (.125, .105, .035), red, "chest")
oval("Chest_Emblem", (.068, -.161, 1.44), (.029, .010, .035), white, "chest")

# Crossed white strings in the existing oval racket frame.
for axis in ("X", "Z"):
    for index in range(-3, 4):
        offset = index * .033
        span = math.sqrt(max(0.0, 1.0 - (offset / .132) ** 2))
        if axis == "X":
            location = (1.34 + offset, -.04, 1.66)
            depth = .30 * span
            rotation = (0, 0, 0)
        else:
            location = (1.34, -.04, 1.66 + offset)
            depth = .236 * span
            rotation = (0, math.pi / 2, 0)
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.0027, depth=depth,
                                            location=location, rotation=rotation)
        string = bpy.context.object
        string.name = f"Racket_String_{axis}_{index}"
        string.data.materials.append(white)
        skin_to_bone(string, "racket_socket")

lock("Hair_Sweep_Left", (-.15, .02, 2.04), (-.34, .07, 2.20), .105, hair)
lock("Hair_Sweep_Right", (.14, .02, 2.07), (.34, .06, 2.22), .11, hair)
lock("Hair_Top_Left", (-.08, .05, 2.12), (-.01, .05, 2.36), .12, hair)
lock("Hair_Top_Right", (.06, .02, 2.12), (.24, -.01, 2.33), .11, hair)
lock("Cyan_Forelock", (-.12, -.17, 2.025), (.135, -.205, 2.16), .084, cyan)
oval("Cyan_Bang", (-.025, -.191, 2.005), (.15, .052, .065), cyan, "head",
     (0, 0, math.radians(-16)))

for obj in bpy.context.scene.objects:
    if obj.type == "MESH" and obj.name != "QC_Floor":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True

arm.animation_data.action = bpy.data.actions["ANIM_SPLIT_STEP"]
bpy.context.scene.frame_set(0)
camera = bpy.context.scene.camera
camera.location = (2.5, -4.2, 2.65)
camera.rotation_euler = ((Vector((0, 0, 1.21)) - camera.location).to_track_quat("-Z", "Y").to_euler())
bpy.context.scene.render.resolution_x = 900
bpy.context.scene.render.resolution_y = 900
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.filepath = str(PREVIEW)
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
for obj in bpy.context.scene.objects:
    obj.select_set(False)
export_objects = [
    obj for obj in bpy.context.scene.objects
    if obj == arm or (obj.type == "MESH" and any(mod.type == "ARMATURE" for mod in obj.modifiers))
]
for obj in export_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(
    filepath=str(GLB),
    export_format="GLB",
    use_selection=True,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_force_sampling=True,
    export_skins=True,
    export_yup=True,
    export_extras=True,
)
print(f"BLEND={BLEND}")
print(f"GLB={GLB}")
print(f"PREVIEW={PREVIEW}")
