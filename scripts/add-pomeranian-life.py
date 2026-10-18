"""Add independent eyelid and chest-breath morphs to the pickup-stage rig."""
import bpy,os,json,math,struct,sys
from mathutils import Vector,Quaternion
out=sys.argv[sys.argv.index('--')+1]if '--'in sys.argv else'/private/tmp/pomeranian-life';os.makedirs(out,exist_ok=True)
mesh=next(o for o in bpy.data.objects if o.type=='MESH');rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
if mesh.data.shape_keys.key_blocks.get('Blink'):raise RuntimeError('Input already has facial morphs; rebuild from the pickup-stage source.')
rig.animation_data.action=None;mesh.data.shape_keys.animation_data.action=None
for pb in rig.pose.bones:pb.rotation_quaternion=Quaternion();pb.location=(0,0,0);pb.scale=(1,1,1)
for key in mesh.data.shape_keys.key_blocks:key.value=0
blink=mesh.shape_key_add(name='Blink');breath=mesh.shape_key_add(name='Breath')
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
eyes=[(-.112,-.322,.725),(.021,-.351,.727)];counts=[0,0];max_breath=0
for v in mesh.data.vertices:
 x,y,z=v.co
 for i,(cx,cy,cz)in enumerate(eyes):
  radius=math.sqrt(((x-cx)/.029)**2+((z-cz)/.027)**2)
  mask=(1-smooth(1,1.8,radius))*(1-smooth(.018,.045,abs(y-cy)))
  if mask>1e-5:
   blink.data[v.index].co.z+=(cz-z)*.96*mask
   blink.data[v.index].co.y+=(cy+.004-y)*.35*mask;counts[i]+=1
 mask=smooth(.23,.34,z)*(1-smooth(.53,.65,z))*(1-smooth(.12,.34,y))
 delta=Vector((x*.015,-.0015,(z-.35)*.012))*mask
 breath.data[v.index].co+=delta;max_breath=max(max_breath,delta.length)
blink.value=0;breath.value=0
scene=bpy.context.scene;scene.frame_set(1);bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/pomeranian-rig.blend')
for image in bpy.data.images:
 if image.size[0]>1024:image.scale(1024,1024);image.pack()
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=out+'/pomeranian.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_influence_nb=4,export_force_sampling=True)
path=out+'/pomeranian.glb';raw=open(path,'rb').read();length=struct.unpack_from('<I',raw,12)[0];asset=json.loads(raw[20:20+length]);binary=raw[20+length:]
for name in ['Sit','Sleep','Pickup','Land']:
 clip=next(a for a in asset['animations']if a['name']==name);morph=next(a for a in asset['animations']if a['name']==name+'Fur');offset=len(clip['samplers']);clip['samplers'].extend(morph['samplers'])
 for channel in morph['channels']:channel['sampler']+=offset;clip['channels'].append(channel)
asset['animations']=[a for a in asset['animations']if not a['name'].endswith('Fur')]
# Drop imperceptible chest-only normal deltas and prune their binary storage.
for primitive in asset['meshes'][0]['primitives']:
 names=asset['meshes'][0].get('extras',{}).get('targetNames',[])
 if 'Breath'in names:primitive['targets'][names.index('Breath')].pop('NORMAL',None)
refs=[]
for m in asset['meshes']:
 for p in m['primitives']:
  refs.extend((p['attributes'],k)for k in p['attributes'])
  if 'indices'in p:refs.append((p,'indices'))
  for target in p.get('targets',[]):refs.extend((target,k)for k in target)
for skin in asset.get('skins',[]):
 if 'inverseBindMatrices'in skin:refs.append((skin,'inverseBindMatrices'))
for animation in asset.get('animations',[]):
 for sampler in animation['samplers']:refs.extend([(sampler,'input'),(sampler,'output')])
used=sorted({o[k]for o,k in refs});mapping={old:new for new,old in enumerate(used)}
for o,k in refs:o[k]=mapping[o[k]]
asset['accessors']=[asset['accessors'][i]for i in used]
viewrefs=[]
for accessor in asset['accessors']:
 if 'bufferView'in accessor:viewrefs.append((accessor,'bufferView'))
 if 'sparse'in accessor:viewrefs.extend([(accessor['sparse']['indices'],'bufferView'),(accessor['sparse']['values'],'bufferView')])
for image in asset.get('images',[]):
 if 'bufferView'in image:viewrefs.append((image,'bufferView'))
usedviews=sorted({o[k]for o,k in viewrefs});mapping={old:new for new,old in enumerate(usedviews)}
for o,k in viewrefs:o[k]=mapping[o[k]]
oldbin=binary[8:];newbin=bytearray();views=[]
for index in usedviews:
 view=dict(asset['bufferViews'][index]);newbin.extend(b'\0'*((-len(newbin))%4));offset=view.get('byteOffset',0);data=oldbin[offset:offset+view['byteLength']];view['byteOffset']=len(newbin);newbin.extend(data);views.append(view)
asset['bufferViews']=views;asset['buffers'][0]['byteLength']=len(newbin);newbin.extend(b'\0'*((-len(newbin))%4));binary=struct.pack('<II',len(newbin),0x004e4942)+newbin

payload=json.dumps(asset,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
with open(path,'wb')as f:f.write(struct.pack('<III',0x46546c67,2,20+len(payload)+len(binary))+struct.pack('<II',len(payload),0x4e4f534a)+payload+binary)
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
if not scene.camera:
 data=bpy.data.cameras.new('Face preview');camera=bpy.data.objects.new('Face preview',data);scene.collection.objects.link(camera);scene.camera=camera
camera=scene.camera;camera.data.type='ORTHO'
if not any(o.type=='LIGHT'for o in scene.objects):
 for loc,power in [((2,-3,4),350),((-3,-1,2),200),((0,3,3),250)]:
  data=bpy.data.lights.new('Softbox','AREA');data.energy=power;data.size=3;o=bpy.data.objects.new('Softbox',data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.45))-o.location).to_track_quat('-Z','Y').to_euler()
for name,amount in [('open',0),('half',.5),('closed',1)]:
 blink.value=amount;camera.data.ortho_scale=.55;camera.location=(0,-3,.68);camera.rotation_euler=(Vector((0,-.1,.68))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=f'{out}/eyes-{name}.png';bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['Sleep'];mesh.data.shape_keys.animation_data.action=bpy.data.actions['SleepFur'];scene.frame_set(31);blink.value=1;breath.value=.7
camera.data.ortho_scale=1.1;camera.location=(1.7,-3,1);camera.rotation_euler=(Vector((0,.03,.45))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=out+'/sleep-closed.png';bpy.ops.render.render(write_still=True)
report={'eye_vertices':counts,'max_breath_displacement':round(max_breath,6),'eye_centers':eyes,'morphs':['Blink','Breath'],'asset_bytes':os.path.getsize(path),'breath_normal_deltas':False}
with open(out+'/life-report.json','w')as f:json.dump(report,f,indent=2)
print('LIFE_REPORT',json.dumps(report))
