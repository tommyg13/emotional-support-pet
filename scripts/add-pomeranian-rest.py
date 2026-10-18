"""Add hips, seated/lying poses and compressed-fur correctives to the gait rig.
Run Blender --background GAIT_SOURCE.blend --python this.py -- OUTPUT.
Keep the input separate: this script rejects an already extended rig.
"""
import bpy,math,os,json,sys,struct
from mathutils import Vector,Quaternion,Matrix
out=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/private/tmp/pomeranian-rest'
os.makedirs(out,exist_ok=True)
mesh=next(o for o in bpy.data.objects if o.type=='MESH');rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
if 'Hips' in rig.data.bones:raise RuntimeError('Input already contains rest poses; rebuild from the sixteen-bone gait source.')
rig.animation_data.action=None
for p in rig.pose.bones:p.rotation_quaternion=Quaternion();p.location=(0,0,0);p.scale=(1,1,1)
bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
hip=rig.data.edit_bones.new('Hips');hip.head=(0,.22,.35);hip.tail=(0,.38,.39);hip.parent=rig.data.edit_bones['Body']
for name in ['RearLUpper','RearRUpper','Tail']:rig.data.edit_bones[name].parent=hip
bpy.ops.object.mode_set(mode='OBJECT')
mesh.vertex_groups.new(name='Hips')
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
bodyGroup=mesh.vertex_groups['Body']
for v in mesh.data.vertices:
 body=next((g.weight for g in v.groups if g.group==bodyGroup.index),0)
 w=body*smooth(-.02,.28,v.co.y)
 if w>1e-6:bodyGroup.add([v.index],body-w,'REPLACE');mesh.vertex_groups['Hips'].add([v.index],w,'REPLACE')
rest={b.name:b.matrix_local.copy()for b in rig.data.bones}
legs={n:tuple(rest[n+p].translation.copy()for p in ['Upper','Lower','Paw']) for n in ['FrontL','FrontR','RearL','RearR']}
# hip, knee, ankle rest positions from the current bone chain.
def reset():
 for p in rig.pose.bones:p.rotation_quaternion=Quaternion();p.location=(0,0,0);p.scale=(1,1,1)
def deform_bone(name,deform,parentDeform=Matrix.Identity(4)):
 desired=deform@rest[name];parent=rig.data.bones[name].parent
 parentPose=parentDeform@rest[parent.name]if parent else Matrix.Identity(4)
 relative=rest[parent.name].inverted()@rest[name]if parent else rest[name]
 basis=relative.inverted()@parentPose.inverted()@desired
 loc,rot,scale=basis.decompose();pb=rig.pose.bones[name];pb.location=loc;pb.rotation_mode='QUATERNION';pb.rotation_quaternion=rot

def pose(kind,amount=1):
 reset();sleep=kind=='Sleep';bodydrop=(.12 if sleep else 0)*amount
 bodyDef=Matrix.Translation((0,0,-bodydrop));deform_bone('Body',bodyDef)
 pivot=rest['Hips'].translation
 rot=Quaternion((1,0,0),math.radians(-8 if sleep else -20)*amount)
 hipLocal=Matrix.Translation((0,.03*amount,(-.025 if sleep else -.10)*amount))@Matrix.Translation(pivot)@rot.to_matrix().to_4x4()@Matrix.Translation(-pivot)
 hipDef=bodyDef@hipLocal;deform_bone('Hips',hipDef,bodyDef)
 for name,(hip,knee,foot) in legs.items():
  rear=name.startswith('Rear');parent='Hips'if rear else'Body';parentDef=hipDef if rear else bodyDef
  currentHip=parentDef@hip
  target=foot.copy();target.y+=((- .13 if rear else -.10)if sleep else(-.09 if rear else 0))*amount
  l1=(knee-hip).length;l2=(foot-knee).length;delta=target-currentHip;direction=delta.normalized();d=min(delta.length,l1+l2-.00001);target=currentHip+direction*d
  a=(l1*l1-l2*l2+d*d)/(2*d);h=math.sqrt(max(0,l1*l1-a*a));preferred=Vector((0,1,0));perp=(preferred-direction*preferred.dot(direction)).normalized();newknee=currentHip+direction*a+perp*h
  upperWorld=(knee-hip).rotation_difference(newknee-currentHip)@rest[name+'Upper'].to_quaternion()
  lowerWorld=(foot-knee).rotation_difference(target-newknee)@rest[name+'Lower'].to_quaternion()
  parentWorld=parentDef.to_quaternion()@rest[parent].to_quaternion()
  for part,pw,dw,pn in [('Upper',parentWorld,upperWorld,parent),('Lower',upperWorld,lowerWorld,name+'Upper'),('Paw',lowerWorld,rest[name+'Paw'].to_quaternion(),name+'Lower')]:
   relative=rest[pn].to_quaternion().inverted()@rest[name+part].to_quaternion();rig.pose.bones[name+part].rotation_quaternion=(pw@relative).inverted()@dw
 if sleep:
  rb=rest['Head'].to_quaternion();rig.pose.bones['Head'].rotation_quaternion=rb.inverted()@Quaternion((1,0,0),math.radians(28)*amount)@rb
 return bodyDef,hipDef
scene=bpy.context.scene
mesh.shape_key_add(name='Basis')
# Correct underside fur compression at the endpoint in rest coordinates.
for kind in ['Sit','Sleep']:
 pose(kind);bpy.context.view_layer.update()
 ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());geo=ev.to_mesh()
 correction=[]
 matrices={name:rig.pose.bones[name].matrix@rest[name].inverted()for name in rest}
 for v,pv in zip(mesh.data.vertices,geo.vertices):
  z=pv.co.z;floor=.005
  dz=(floor+z+math.sqrt((z-floor)**2+.003**2))/2-z
  if dz<.0001:correction.append(Vector((0,0,0)));continue
  matrix=Matrix(((0,0,0),(0,0,0),(0,0,0)))
  for g in v.groups:
   name=mesh.vertex_groups[g.group].name
   if name in matrices:matrix+=matrices[name].to_3x3()*g.weight
  correction.append(matrix.inverted_safe()@Vector((0,0,dz)))
 ev.to_mesh_clear();key=mesh.shape_key_add(name=kind+'Fur')
 for vertex,delta in zip(key.data,correction):vertex.co+=delta
 key.value=0
reset()

# Add held endpoint clips; runtime controls transition weight and reverse wake.
for kind in ['Sit','Sleep']:
 action=bpy.data.actions.new(kind);rig.animation_data.action=action
 mesh.data.shape_keys.animation_data_create();morphAction=bpy.data.actions.new(kind+'Fur');mesh.data.shape_keys.animation_data.action=morphAction
 for frame,amount in [(1,0),(7,.16),(16,.62),(25,1),(31,1)]:
  pose(kind,amount)
  for key in mesh.data.shape_keys.key_blocks:
   if key.name!='Basis':key.value=amount if key.name==kind+'Fur'else 0;key.keyframe_insert('value',frame=frame)
  for pb in rig.pose.bones:
   pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name);pb.keyframe_insert('location',frame=frame,group=pb.name)
 track=rig.animation_data.nla_tracks.new();track.name=kind;track.strips.new(kind,1,action);track.mute=True;action.use_fake_user=True
 morphAction.use_fake_user=True
 mtrack=mesh.data.shape_keys.animation_data.nla_tracks.new();mtrack.name=kind;mtrack.strips.new(kind,1,morphAction);mtrack.mute=True
rig.animation_data.action=None;mesh.data.shape_keys.animation_data.action=None;reset();scene.frame_set(1)
for key in mesh.data.shape_keys.key_blocks:key.value=0
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/pomeranian-rig.blend')
for im in bpy.data.images:
 if im.size[0]>1024:im.scale(1024,1024);im.pack()
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=out+'/pomeranian.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_influence_nb=4,export_force_sampling=True)

# Keep the corrective fur morph in the same named clip as its skeletal pose.
path=out+'/pomeranian.glb'
with open(path,'rb')as f:raw=f.read()
length=struct.unpack_from('<I',raw,12)[0];asset=json.loads(raw[20:20+length]);binary=raw[20+length:]
for name in ['Sit','Sleep']:
 clip=next(a for a in asset['animations']if a['name']==name);morph=next(a for a in asset['animations']if a['name']==name+'Fur');offset=len(clip['samplers'])
 clip['samplers'].extend(morph['samplers'])
 for channel in morph['channels']:channel['sampler']+=offset;clip['channels'].append(channel)
asset['animations']=[a for a in asset['animations']if a['name']not in ['SitFur','SleepFur']]
payload=json.dumps(asset,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
with open(path,'wb')as f:f.write(struct.pack('<III',0x46546c67,2,20+len(payload)+len(binary))+struct.pack('<II',len(payload),0x4e4f534a)+payload+binary)

# Render from both sides and measure the belly relative to the ground.
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=650;scene.render.resolution_y=650;scene.render.resolution_percentage=100
if not scene.camera:
 data=bpy.data.cameras.new('Rest preview');camera=bpy.data.objects.new('Rest preview',data);scene.collection.objects.link(camera);scene.camera=camera
camera=scene.camera;camera.data.type='ORTHO';camera.data.ortho_scale=1.1
if not any(o.type=='LIGHT'for o in scene.objects):
 for loc,power in [((2,-3,4),350),((-3,-1,2),200),((0,3,3),250)]:
  data=bpy.data.lights.new('Softbox','AREA');data.energy=power;data.size=3;light=bpy.data.objects.new('Softbox',data);scene.collection.objects.link(light);light.location=loc;light.rotation_euler=(Vector((0,0,.45))-light.location).to_track_quat('-Z','Y').to_euler()
report={}
for kind in ['Sit','Sleep']:
 rig.animation_data.action=bpy.data.actions[kind];mesh.data.shape_keys.animation_data.action=bpy.data.actions[kind+'Fur'];scene.frame_set(31)
 ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());geo=ev.to_mesh();peak=1
 for edge in mesh.data.edges:
  a,b=edge.vertices;length=(mesh.data.vertices[a].co-mesh.data.vertices[b].co).length
  if length>.002:peak=max(peak,(geo.vertices[a].co-geo.vertices[b].co).length/length)
 report[kind]={'min_z':round(min(v.co.z for v in geo.vertices),4),'max_edge_stretch':round(peak,3)};ev.to_mesh_clear()
 for side in [1,-1]:
  camera.location=(side*2,-.55,.8);camera.rotation_euler=(Vector((0,.02,.43))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=out+'/'+kind+str(side)+'.png';bpy.ops.render.render(write_still=True)
with open(out+'/rest-report.json','w')as f:json.dump(report,f,indent=2)
print('REST_REPORT',json.dumps(report))
