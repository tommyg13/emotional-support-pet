"""Prepare the approved Cute-v2 panda for the offline dock (run on that .blend)."""
import bpy,sys,os,math,json
from mathutils import Quaternion
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True)
rig=bpy.data.objects['Bamboo Buddy rig'];rig.animation_data.action=None
for p in rig.pose.bones:p.rotation_quaternion=Quaternion();p.location=(0,0,0);p.scale=(1,1,1)
scene=bpy.context.scene;scene.frame_set(1)
eye_names=['eye rim','iris','pupil','large eye glint','small eye glint'];eyes=[]
for o in bpy.data.objects:
 if o.type!='MESH' or not any(o.name.endswith(n) for n in eye_names):continue
 if o.data.shape_keys:raise RuntimeError('Input is already prepared')
 o.shape_key_add(name='Basis');key=o.shape_key_add(name='Blink')
 # All components collapse toward the same eyelid height, including highlights.
 target=2.035-o.location.z
 for v in key.data:v.co.z+=(target-v.co.z)*.985
 eyes.append(o.name)
clip=bpy.data.actions.new('Sleep');clip.use_fake_user=True;rig.animation_data.action=clip
for frame,amount in [(1,0),(31,1)]:
 rig.pose.bones['Head'].rotation_quaternion=Quaternion((1,0,0),.23*amount)
 for p in rig.pose.bones:p.keyframe_insert('rotation_quaternion',frame=frame);p.keyframe_insert('location',frame=frame)
track=rig.animation_data.nla_tracks.new();track.name='Sleep';track.mute=True;track.strips.new('Sleep',1,clip)
rig.animation_data.action=None
for p in rig.pose.bones:p.rotation_quaternion=Quaternion();p.location=(0,0,0);p.scale=(1,1,1)
scene.frame_set(1);bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/panda-rig.blend')
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in bpy.data.objects:
 if o.type=='MESH' and o.parent==rig:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out+'/panda.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_force_sampling=True)
with open(out+'/rig-report.json','w')as f:json.dump({'bones':len(rig.pose.bones),'blink_meshes':eyes,'posture':'seated doze','clips':['SeatedIdle','Nibble','Sleep'],'asset_bytes':os.path.getsize(out+'/panda.glb')},f,indent=2)
