"""Build a self-owned rigged mannequin with Split Step and Jump Smash actions.

Run:
  blender --background --python animation_research/tools/build_m1_rig.py

The asset is deliberately simple: it proves the Blender -> GLB -> runtime
animation contract without copying a person, logo, mesh or texture from the
reference footage.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
BLEND = ROOT / "04_blender" / "m1_split_smash_rig.blend"
GLB = ROOT / "05_exports" / "m1_split_smash_rig.glb"
PREVIEW = ROOT / "06_qc" / "m1_rig_preview.png"
PREVIEW_NEUTRAL = ROOT / "06_qc" / "m1_neutral_preview.png"
PREVIEW_SPLIT = ROOT / "06_qc" / "m1_split_land_preview.png"
for path in (BLEND, GLB, PREVIEW, PREVIEW_NEUTRAL, PREVIEW_SPLIT):
    path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for block in (bpy.data.actions, bpy.data.armatures, bpy.data.meshes, bpy.data.materials):
    pass


def material(name, color, metallic=0.0, roughness=0.65):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.metallic = metallic
    mat.roughness = roughness
    return mat


MAT_SKIN = material("MAT_Skin", (0.55, 0.28, 0.16), 0.0, 0.82)
MAT_SHIRT = material("MAT_Shirt", (0.035, 0.22, 0.28), 0.0, 0.55)
MAT_SHORTS = material("MAT_Shorts", (0.025, 0.035, 0.055), 0.0, 0.72)
MAT_SHOE = material("MAT_Shoes", (0.82, 0.88, 0.84), 0.0, 0.48)
MAT_RACKET = material("MAT_Racket", (0.8, 0.66, 0.22), 0.55, 0.3)


arm_data = bpy.data.armatures.new("SA3D_HumanoidRig")
arm = bpy.data.objects.new("SA3D_HumanoidRig", arm_data)
bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")


def add_bone(name, head, tail, parent=None):
    bone = arm_data.edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    if parent:
        bone.parent = arm_data.edit_bones[parent]
    return bone


add_bone("root", (0, 0, 0.04), (0, 0, 0.22))
add_bone("pelvis", (0, 0, 0.84), (0, 0, 1.02), "root")
add_bone("spine", (0, 0, 1.02), (0, 0, 1.34), "pelvis")
add_bone("chest", (0, 0, 1.34), (0, 0, 1.57), "spine")
add_bone("neck", (0, 0, 1.57), (0, 0, 1.70), "chest")
add_bone("head", (0, 0, 1.70), (0, 0, 1.93), "neck")
for side, sign in (("L", -1), ("R", 1)):
    add_bone(f"upper_arm.{side}", (sign*.22, 0, 1.51), (sign*.52, 0, 1.42), "chest")
    add_bone(f"forearm.{side}", (sign*.52, 0, 1.42), (sign*.78, -.02, 1.26), f"upper_arm.{side}")
    add_bone(f"hand.{side}", (sign*.78, -.02, 1.26), (sign*.91, -.04, 1.20), f"forearm.{side}")
    add_bone(f"thigh.{side}", (sign*.145, 0, .91), (sign*.14, 0, .52), "pelvis")
    add_bone(f"shin.{side}", (sign*.14, 0, .52), (sign*.14, 0, .13), f"thigh.{side}")
    add_bone(f"foot.{side}", (sign*.14, 0, .13), (sign*.14, -.25, .07), f"shin.{side}")
add_bone("racket_socket", (.91, -.04, 1.20), (1.18, -.04, 1.48), "hand.R")
bpy.ops.object.mode_set(mode="POSE")
for pb in arm.pose.bones:
    pb.rotation_mode = "XYZ"
bpy.ops.object.mode_set(mode="OBJECT")


EXPORT_OBJECTS = [arm]


def skin_to_bone(obj, bone):
    """Rigid-skin one mesh part to one bone in the armature rest pose."""
    group = obj.vertex_groups.new(name=bone)
    group.add(range(len(obj.data.vertices)), 1.0, "REPLACE")
    modifier = obj.modifiers.new(name="Armature", type="ARMATURE")
    modifier.object = arm
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    EXPORT_OBJECTS.append(obj)


def capsule(name, a, b, radius, mat, bone, scale=(1, 1, 1)):
    a, b = Vector(a), Vector(b)
    mid = (a + b) * .5
    delta = b - a
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=mid)
    obj = bpy.context.object
    obj.name = name
    obj.scale = (radius*scale[0], radius*scale[1], delta.length*.5*scale[2])
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = delta.to_track_quat("Z", "Y")
    obj.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    skin_to_bone(obj, bone)
    return obj


capsule("Body_Pelvis", (-.25, 0, .90), (.25, 0, .90), .21, MAT_SHORTS, "pelvis", (1, .76, 1))
capsule("Body_Abdomen", (0, 0, .96), (0, 0, 1.37), .205, MAT_SHIRT, "spine", (1, .66, 1))
capsule("Body_Chest", (0, 0, 1.31), (0, 0, 1.59), .245, MAT_SHIRT, "chest", (1, .64, 1))
capsule("Body_Neck", (0, 0, 1.54), (0, 0, 1.73), .09, MAT_SKIN, "neck", (1, .92, 1))
bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=(0, 0, 1.80), scale=(.145, .13, .18))
head = bpy.context.object
head.name = "Body_Head"
head.data.materials.append(MAT_SKIN)
skin_to_bone(head, "head")
for side, sign in (("L", -1), ("R", 1)):
    capsule(f"Arm_Upper_{side}", (sign*.205, 0, 1.52), (sign*.535, 0, 1.415), .09, MAT_SHIRT, f"upper_arm.{side}")
    capsule(f"Arm_Fore_{side}", (sign*.515, 0, 1.43), (sign*.80, -.02, 1.25), .068, MAT_SKIN, f"forearm.{side}")
    capsule(f"Hand_{side}", (sign*.78, -.02, 1.27), (sign*.925, -.04, 1.19), .073, MAT_SKIN, f"hand.{side}")
    capsule(f"Leg_Thigh_{side}", (sign*.145, 0, .94), (sign*.14, 0, .50), .125, MAT_SHORTS, f"thigh.{side}")
    capsule(f"Leg_Shin_{side}", (sign*.14, 0, .54), (sign*.14, 0, .105), .09, MAT_SKIN, f"shin.{side}")
    capsule(f"Foot_{side}", (sign*.14, .04, .11), (sign*.14, -.28, .075), .10, MAT_SHOE, f"foot.{side}", (1.05, .86, 1.0))

# Racket handle/shaft/frame; self-created geometry.
capsule("Racket_Shaft", (.93, -.04, 1.22), (1.25, -.04, 1.56), .012, MAT_RACKET, "racket_socket")
bpy.ops.mesh.primitive_torus_add(major_radius=.16, minor_radius=.012, major_segments=32, minor_segments=6, location=(1.34, -.04, 1.66), rotation=(math.pi/2, 0, 0))
racket = bpy.context.object
racket.name = "Racket_Frame"
racket.scale.x = .78
racket.data.materials.append(MAT_RACKET)
skin_to_bone(racket, "racket_socket")


def set_pose(frame, rotations=None, locations=None):
    rotations = rotations or {}
    locations = locations or {}
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
    for name, degrees in rotations.items():
        arm.pose.bones[name].rotation_euler = tuple(math.radians(v) for v in degrees)
    for name, value in locations.items():
        arm.pose.bones[name].location = value
    for pb in arm.pose.bones:
        pb.keyframe_insert("rotation_euler", frame=frame, group=pb.name)
        pb.keyframe_insert("location", frame=frame, group=pb.name)


def new_action(name, end_frame):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = action
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end = end_frame
    return action


# Split-step: in-place hop, wide landing, then a small right-side direction commit.
new_action("ANIM_SPLIT_STEP", 20)
set_pose(0, {"upper_arm.L": (4, 0, -18), "upper_arm.R": (4, 0, 18), "forearm.R": (0, 20, 8)})
set_pose(5, {"pelvis": (7, 0, 0), "thigh.L": (-7, 0, -5), "thigh.R": (-7, 0, 5)}, {"root": (0, 0, -.035)})
set_pose(9, {"thigh.L": (3, 0, 8), "thigh.R": (3, 0, -8)}, {"root": (0, 0, .075)})
set_pose(12, {"pelvis": (8, 0, 0), "thigh.L": (-10, 0, 24), "thigh.R": (-10, 0, -24), "shin.L": (18, 0, 0), "shin.R": (18, 0, 0)}, {"root": (0, 0, -.055)})
set_pose(15, {"pelvis": (5, 0, -6), "thigh.L": (-4, 0, 12), "thigh.R": (-14, 0, -25), "shin.R": (22, 0, 0)}, {"root": (.035, 0, -.02)})
set_pose(20, {"upper_arm.L": (4, 0, -18), "upper_arm.R": (4, 0, 18), "forearm.R": (0, 20, 8)})

# Jump smash: shoulder/hip turn, takeoff, overhead contact, scissor landing, recovery.
new_action("ANIM_SMASH_OVERHEAD_JUMP", 41)
set_pose(0, {"upper_arm.L": (5, 0, -18), "upper_arm.R": (5, 0, 18), "forearm.R": (0, 18, 6)})
set_pose(10, {"pelvis": (5, 0, -12), "spine": (0, 0, -6), "chest": (0, 0, -16), "upper_arm.L": (-12, 4, -24), "upper_arm.R": (48, -8, 34), "forearm.R": (-62, 0, 8), "thigh.L": (-10, 0, 8), "thigh.R": (-14, 0, -10)}, {"root": (0, .02, -.045)})
set_pose(19, {"pelvis": (0, 0, -12), "spine": (-4, 0, -6), "chest": (-6, 0, -20), "upper_arm.L": (-20, 0, -28), "upper_arm.R": (72, -12, 24), "forearm.R": (-52, 0, 5), "thigh.L": (10, 0, 10), "thigh.R": (-20, 0, -12), "shin.L": (18, 0, 0), "shin.R": (28, 0, 0)}, {"root": (0, 0, .16)})
set_pose(24, {"pelvis": (-3, 0, 5), "spine": (-5, 0, 7), "chest": (-8, 0, 12), "upper_arm.L": (-24, 0, -24), "upper_arm.R": (88, -5, 10), "forearm.R": (-22, 0, 0), "hand.R": (0, 20, 0), "thigh.L": (15, 0, -10), "thigh.R": (-14, 0, 10), "shin.L": (22, 0, 0), "shin.R": (24, 0, 0)}, {"root": (0, -.02, .21)})
set_pose(25, {"pelvis": (-2, 0, 8), "spine": (0, 0, 10), "chest": (6, 0, 16), "upper_arm.L": (-18, 0, -18), "upper_arm.R": (100, 4, -4), "forearm.R": (8, 0, 0), "hand.R": (0, 28, 0), "thigh.L": (18, 0, -12), "thigh.R": (-10, 0, 12), "shin.L": (18, 0, 0), "shin.R": (28, 0, 0)}, {"root": (0, -.035, .19)})
set_pose(30, {"pelvis": (3, 0, 14), "spine": (4, 0, 10), "chest": (10, 0, 16), "upper_arm.R": (35, 12, -30), "forearm.R": (-35, 0, -8), "thigh.L": (-16, 0, -12), "thigh.R": (8, 0, 12), "shin.L": (28, 0, 0), "shin.R": (16, 0, 0)}, {"root": (0, -.06, .03)})
set_pose(34, {"pelvis": (5, 0, 6), "chest": (6, 0, 8), "upper_arm.R": (18, 6, -18), "forearm.R": (-20, 0, 0), "thigh.L": (-12, 0, 10), "thigh.R": (-6, 0, -10), "shin.L": (20, 0, 0), "shin.R": (16, 0, 0)}, {"root": (0, -.04, -.04)})
set_pose(41, {"upper_arm.L": (5, 0, -18), "upper_arm.R": (5, 0, 18), "forearm.R": (0, 18, 6)})

for action in bpy.data.actions:
    for fcurve in action.fcurves:
        for key in fcurve.keyframe_points:
            key.interpolation = "BEZIER"

# Neutral presentation scene and a preview at smash contact.
bpy.context.scene.render.engine = "BLENDER_WORKBENCH"
bpy.context.scene.display.shading.light = "STUDIO"
bpy.context.scene.display.shading.color_type = "MATERIAL"
bpy.context.scene.render.resolution_x = 720
bpy.context.scene.render.resolution_y = 720
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.image_settings.file_format = "PNG"
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
floor = bpy.context.object
floor.name = "QC_Floor"
floor.data.materials.append(material("MAT_Floor", (.06, .22, .20), 0.0, .9))
bpy.ops.object.light_add(type="AREA", location=(3, -4, 6))
bpy.context.object.data.energy = 1000
bpy.context.object.data.shape = "DISK"
bpy.context.object.data.size = 5
bpy.ops.object.light_add(type="AREA", location=(-4, 1, 3))
bpy.context.object.data.energy = 600
bpy.context.object.data.size = 4
bpy.ops.object.camera_add(location=(4.2, -6.2, 2.9))
camera = bpy.context.object
camera.rotation_euler = ((Vector((0, 0, 1.05)) - camera.location).to_track_quat("-Z", "Y").to_euler())
bpy.context.scene.camera = camera
def render_action(action_name, frame, filepath):
    arm.animation_data.action = bpy.data.actions[action_name]
    bpy.context.scene.frame_set(frame)
    bpy.context.scene.render.filepath = str(filepath)
    bpy.ops.render.render(write_still=True)


render_action("ANIM_SPLIT_STEP", 0, PREVIEW_NEUTRAL)
render_action("ANIM_SPLIT_STEP", 12, PREVIEW_SPLIT)
render_action("ANIM_SMASH_OVERHEAD_JUMP", 25, PREVIEW)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))

# Keep QC-only floor/lights/camera out of the GLB.
for obj in bpy.context.scene.objects:
    obj.select_set(False)
for obj in EXPORT_OBJECTS:
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
