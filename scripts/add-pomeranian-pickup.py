"""Extend the rest rig with relaxed pickup and a planted landing crouch."""
import bpy,math,os,json,struct,sys
from mathutils import Vector,Quaternion,Matrix
out=sys.argv[sys.argv.index('--')+1]if '--'in sys.argv else'/private/tmp/pomeranian-pickup';os.makedirs(out,exist_ok=True)
mesh=next(o for o in bpy.data.objects if o.type=='MESH');rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
if bpy.data.actions.get('Pickup'):raise RuntimeError('Input already contains pickup actions; rebuild from the rest-stage source.')
rig.animation_data.action=None;mesh.data.shape_keys.animation_data.action=None
rest={bone.name:bone.matrix_local.copy()for bone in rig.data.bones}
legs={n:tuple(rest[n+p].translation.copy()for p in ['Upper','Lower','Paw'])for n in ['FrontL','FrontR','RearL','RearR']}
def reset():
 for pb in rig.pose.bones:pb.rotation_quaternion=Quaternion();pb.location=(0,0,0);pb.scale=(1,1,1)
 for key in mesh.data.shape_keys.key_blocks:key.value=0

def rotation(name,x=0,y=0):
 rb=rest[name].to_quaternion();world=Quaternion((1,0,0),math.radians(x))@Quaternion((0,1,0),math.radians(y));return rb.inverted()@world@rb

def pickup(amount):
 reset()
 for name in legs:
  front=name.startswith('Front');side=1 if name.endswith('L')else-1
  rig.pose.bones[name+'Upper'].rotation_quaternion=rotation(name+'Upper',(-5 if front else-8)*amount,side*3*amount)
  rig.pose.bones[name+'Lower'].rotation_quaternion=rotation(name+'Lower',(25 if front else 28)*amount)
  rig.pose.bones[name+'Paw'].rotation_quaternion=rotation(name+'Paw',(0 if front else-8)*amount)
 # Small downward head tilt without changing the face or neck silhouette.
 rig.pose.bones['Head'].rotation_quaternion=rotation('Head',3*amount)

def landing(amount):
 reset();bodyDef=Matrix.Translation((0,0,-.018*amount));rb=rest['Body'];rig.pose.bones['Body'].location=rb.to_3x3().inverted()@Vector((0,0,-.018*amount))
 for name,(hip,knee,foot)in legs.items():
  parent='Hips'if name.startswith('Rear')else'Body';currentHip=bodyDef@hip
  delta=foot-currentHip;d=delta.length;direction=delta.normalized();l1=(knee-hip).length;l2=(foot-knee).length
  a=(l1*l1-l2*l2+d*d)/(2*d);h=math.sqrt(max(0,l1*l1-a*a));p=Vector((0,1,0));perp=(p-direction*p.dot(direction)).normalized();newknee=currentHip+direction*a+perp*h
  upper=(knee-hip).rotation_difference(newknee-currentHip)@rest[name+'Upper'].to_quaternion()
  lower=(foot-knee).rotation_difference(foot-newknee)@rest[name+'Lower'].to_quaternion()
  for part,pw,dw,pn in [('Upper',rest[parent].to_quaternion(),upper,parent),('Lower',upper,lower,name+'Upper'),('Paw',lower,rest[name+'Paw'].to_quaternion(),name+'Lower')]:
   relative=rest[pn].to_quaternion().inverted()@rest[name+part].to_quaternion();rig.pose.bones[name+part].rotation_quaternion=(pw@relative).inverted()@dw

for name,keys,pose in [('Pickup',[(1,0),(4,.5),(7,1),(10,1)],pickup),('Land',[(1,0),(5,.75),(7,1),(12,.25),(19,0)],landing)]:
 action=bpy.data.actions.new(name);rig.animation_data.action=action
 morph=bpy.data.actions.new(name+'Fur');mesh.data.shape_keys.animation_data.action=morph
 for frame,amount in keys:
  pose(amount)
  for pb in rig.pose.bones:
   pb.rotation_mode='QUATERNION';pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name);pb.keyframe_insert('location',frame=frame,group=pb.name)
  for key in mesh.data.shape_keys.key_blocks:
   if key.name!='Basis':key.value=0;key.keyframe_insert('value',frame=frame)
 for owner,clip in [(rig,action),(mesh.data.shape_keys,morph)]:
  track=owner.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,clip);track.mute=True;clip.use_fake_user=True
rig.animation_data.action=None;mesh.data.shape_keys.animation_data.action=None;reset();scene=bpy.context.scene;scene.frame_set(1)
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=out+'/pomeranian-rig.blend')
for image in bpy.data.images:
 if image.size[0]>1024:image.scale(1024,1024);image.pack()
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=out+'/pomeranian.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_influence_nb=4,export_force_sampling=True)
path=out+'/pomeranian.glb';raw=open(path,'rb').read();length=struct.unpack_from('<I',raw,12)[0];asset=json.loads(raw[20:20+length]);binary=raw[20+length:]
for name in ['Sit','Sleep','Pickup','Land']:
 clip=next(a for a in asset['animations']if a['name']==name);morph=next(a for a in asset['animations']if a['name']==name+'Fur');offset=len(clip['samplers']);clip['samplers'].extend(morph['samplers'])
 for channel in morph['channels']:channel['sampler']+=offset;clip['channels'].append(channel)
asset['animations']=[a for a in asset['animations']if not a['name'].endswith('Fur')]
payload=json.dumps(asset,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
with open(path,'wb')as f:f.write(struct.pack('<III',0x46546c67,2,20+len(payload)+len(binary))+struct.pack('<II',len(payload),0x4e4f534a)+payload+binary)
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=650;scene.render.resolution_y=650;scene.render.resolution_percentage=100
if not scene.camera:
 data=bpy.data.cameras.new('Pickup preview');camera=bpy.data.objects.new('Pickup preview',data);scene.collection.objects.link(camera);scene.camera=camera
camera=scene.camera;camera.data.type='ORTHO';camera.data.ortho_scale=1.1
if not any(o.type=='LIGHT'for o in scene.objects):
 for loc,power in [((2,-3,4),350),((-3,-1,2),200),((0,3,3),250)]:
  data=bpy.data.lights.new('Softbox','AREA');data.energy=power;data.size=3;light=bpy.data.objects.new('Softbox',data);scene.collection.objects.link(light);light.location=loc;light.rotation_euler=(Vector((0,0,.45))-light.location).to_track_quat('-Z','Y').to_euler()
report={}
for name,frame in [('Pickup',10),('Land',7)]:
 rig.animation_data.action=bpy.data.actions[name];mesh.data.shape_keys.animation_data.action=bpy.data.actions[name+'Fur'];scene.frame_set(frame)
 ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());geo=ev.to_mesh();peak=1
 for edge in mesh.data.edges:
  a,b=edge.vertices;length=(mesh.data.vertices[a].co-mesh.data.vertices[b].co).length
  if length>.002:peak=max(peak,(geo.vertices[a].co-geo.vertices[b].co).length/length)
 report[name]={'max_edge_stretch':round(peak,3),'min_z':round(min(v.co.z for v in geo.vertices),4)};ev.to_mesh_clear()
 for side in [1,-1]:
  camera.location=(side*2,-.5,.8);camera.rotation_euler=(Vector((0,.02,.43))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=f'{out}/{name}{side}.png';bpy.ops.render.render(write_still=True)
with open(out+'/pickup-report.json','w')as f:json.dump(report,f,indent=2)
print('PICKUP_REPORT',json.dumps(report))
