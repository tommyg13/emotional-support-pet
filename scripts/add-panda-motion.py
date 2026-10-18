"""Extend the seated panda with a toy-like biped waddle and desktop poses."""
import bpy,sys,os,math,json
from mathutils import Vector,Quaternion,Matrix
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True)
rig=bpy.data.objects['Bamboo Buddy rig'];scene=bpy.context.scene
if bpy.data.actions.get('Walk'):raise RuntimeError('Rebuild from the seated panda source')
rig.animation_data.action=None
for mesh in bpy.data.objects:
 if mesh.type=='MESH' and mesh.data.shape_keys:
  for key in mesh.data.shape_keys.key_blocks:key.value=0
meshes=[o for o in bpy.data.objects if o.type=='MESH' and o.parent==rig]
def reset():
 for p in rig.pose.bones:p.rotation_quaternion=Quaternion();p.location=(0,0,0);p.scale=(1,1,1)
def offset(bone,vector):rig.pose.bones[bone].location=rig.data.bones[bone].matrix_local.to_3x3().inverted()@Vector(vector)
def stand(amount=1,phase=None,run=False,held=False,land=0):
 reset();bob=(.016 if not run else .027)*(1-math.cos(phase*2)) if phase is not None else 0
 offset('Body',(0,0,(.16+bob-.045*land)*amount))
 if phase is not None:rig.pose.bones['Body'].rotation_quaternion=Quaternion(rig.data.bones['Body'].matrix_local.to_quaternion().inverted()@Vector((0,1,0)),.025*math.sin(phase))
 bpy.context.view_layer.update()
 for side,label in [(-1,'L'),(1,'R')]:
  old=Vector((side*.49,-.28,.30));target=Vector((side*.29,.015,.31));angle=math.pi/2
  if phase is not None:
   p=phase+(math.pi if side<0 else 0);stride=.22 if run else .16
   target.y+=stride*math.cos(p);target.z+=(.075 if run else .045)*max(0,math.sin(p))
  if held:target=Vector((side*.32,.015,.17));angle=.35
  delta=(target-old)*amount;transform=Matrix.Translation(old+delta)@Quaternion((1,0,0),angle*amount).to_matrix().to_4x4()@Matrix.Translation(-old)
  rig.pose.bones[label+'Foot'].matrix=transform@rig.data.bones[label+'Foot'].matrix_local
 if held:rig.pose.bones['Head'].rotation_quaternion=Quaternion((0,1,0),-.06)
def key(frame):
 for p in rig.pose.bones:
  p.keyframe_insert('location',frame=frame);p.keyframe_insert('rotation_quaternion',frame=frame);p.keyframe_insert('scale',frame=frame)
report={}
for name,last in [('Stand',16),('Sit',16),('Walk',25),('Run',19),('RoamSleep',46),('Pickup',10),('Land',16)]:
 clip=bpy.data.actions.new(name);clip.use_fake_user=True;rig.animation_data.action=clip;minimum=100
 for frame in range(1,last+1):
  u=(frame-1)/(last-1);ease=u*u*(3-2*u)
  if name=='Stand':stand(ease)
  elif name=='Sit':stand(1-ease)
  elif name in ['Walk','Run']:stand(1,u*math.pi*2,name=='Run')
  elif name=='RoamSleep':
   stand(1-min(1,u*3));rig.pose.bones['Head'].rotation_quaternion=Quaternion((1,0,0),.23*max(0,(u-1/3)*1.5))
  elif name=='Pickup':stand(1,held=True)
  elif name=='Land':stand(1,land=math.sin(u*math.pi))
  key(frame);scene.frame_set(frame);bpy.context.view_layer.update()
  deps=bpy.context.evaluated_depsgraph_get()
  for label in ['L seated foot','R seated foot']:
   obj=bpy.data.objects[label].evaluated_get(deps);minimum=min(minimum,min((obj.matrix_world@v.co).z for v in obj.data.vertices))
 # Linear sampled tracks keep the gait floor-safe between keys.
 for layer in clip.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     for k in fc.keyframe_points:k.interpolation='LINEAR'
 report[name]={'frames':last,'minimum_foot_z':round(minimum,6)}
 track=rig.animation_data.nla_tracks.new();track.name=name;track.mute=True;track.strips.new(name,1,clip);rig.animation_data.action=None
reset();scene.frame_set(1);bpy.context.view_layer.update();bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/panda-rig.blend')
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out+'/panda.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_force_sampling=True)
metadata={'bones':len(rig.pose.bones),'blink_meshes':[o.name for o in meshes if o.data.shape_keys and o.data.shape_keys.key_blocks.get('Blink')],'posture':'seated doze and standing waddle','clips':['SeatedIdle','Nibble','Sleep']+list(report),'asset_bytes':os.path.getsize(out+'/panda.glb')}
with open(out+'/rig-report.json','w')as f:json.dump(metadata,f,indent=2)
with open(out+'/motion-report.json','w')as f:json.dump(report,f,indent=2)
# Inspection renders use the existing approved studio, without saving a new default pose.
for name,frame in [('Stand',16),('Walk',7),('Pickup',10)]:
 rig.animation_data.action=bpy.data.actions[name];scene.frame_set(frame);scene.render.filepath=out+'/'+name+'.png';bpy.ops.render.render(write_still=True)
print('PANDA_MOTION',json.dumps(report))
