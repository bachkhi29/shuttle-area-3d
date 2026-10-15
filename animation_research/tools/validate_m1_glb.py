"""Re-import the M1 GLB and fail when its runtime contract is incomplete.

Run:
  blender --background --python animation_research/tools/validate_m1_glb.py
"""
from pathlib import Path
import json
import struct
import sys

import bpy


ROOT = Path(__file__).resolve().parents[1]
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
GLB = ROOT / (args[0] if args else "05_exports/m1_split_smash_rig.glb")
REPORT = ROOT / (args[1] if len(args) > 1 else "06_qc/m1_glb_validation.json")
EXPECTED_ACTIONS = {
    "ANIM_SPLIT_STEP": 20,
    "ANIM_SMASH_OVERHEAD_JUMP": 41,
}

with GLB.open("rb") as stream:
    header = stream.read(12)
    magic, version, total_length = struct.unpack("<4sII", header)
    if magic != b"glTF" or version != 2:
        raise ValueError("expected a GLB v2 file")
    gltf = None
    while stream.tell() < total_length:
        chunk_length, chunk_type = struct.unpack("<II", stream.read(8))
        chunk = stream.read(chunk_length)
        if chunk_type == 0x4E4F534A:
            gltf = json.loads(chunk.rstrip(b" \\0"))
    if gltf is None:
        raise ValueError("missing JSON chunk in GLB")

bpy.ops.wm.read_factory_settings(use_empty=True)
result = bpy.ops.import_scene.gltf(filepath=str(GLB))

actions = {}
for action in bpy.data.actions:
    start, end = action.frame_range
    actions[action.name] = {
        "frameStart": round(start, 3),
        "frameEnd": round(end, 3),
        "durationFrames": round(end - start, 3),
        "fcurves": len(action.fcurves),
    }

armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
materials = sorted({slot.material.name for obj in meshes for slot in obj.material_slots if slot.material})
skinned = [
    obj.name
    for obj in meshes
    if any(modifier.type == "ARMATURE" for modifier in obj.modifiers)
]

errors = []
exported_action_names = [action.get("name") for action in gltf.get("animations", [])]
if "FINISHED" not in result:
    errors.append("GLB import did not finish")
for name, duration in EXPECTED_ACTIONS.items():
    # Blender appends the armature name while importing; the GLB itself must
    # keep the exact contract name consumed by Three.js AnimationMixer.
    imported_name = next((candidate for candidate in actions if candidate.startswith(name)), None)
    if name not in exported_action_names:
        errors.append(f"missing exported action: {name}")
    if imported_name is None:
        errors.append(f"missing re-imported action: {name}")
    elif abs(actions[imported_name]["durationFrames"] - duration) > 0.01:
        errors.append(
            f"wrong duration for {name}: {actions[imported_name]['durationFrames']} frames"
        )
if len(armatures) != 1:
    errors.append(f"expected 1 armature, found {len(armatures)}")
if len(skinned) < 18:
    errors.append(f"expected at least 18 skinned meshes, found {len(skinned)}")
if len(materials) < 5:
    errors.append(f"expected at least 5 materials, found {len(materials)}")

payload = {
    "status": "FAIL" if errors else "PASS",
    "source": str(GLB.relative_to(ROOT)),
    "exportedActionNames": exported_action_names,
    "actions": actions,
    "armatures": [obj.name for obj in armatures],
    "meshCount": len(meshes),
    "skinnedMeshCount": len(skinned),
    "materials": materials,
    "errors": errors,
}
REPORT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload, ensure_ascii=False, indent=2))
sys.exit(1 if errors else 0)
