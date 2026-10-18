"""Add small lower-muzzle chewing and tongue-lapping shapes to the life-stage source."""
import bpy,os,json,math,struct,sys
from mathutils import Vector,Quaternion
out=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/private/tmp/pomeranian-care'
os.makedirs(out,exist_ok=True)
mesh=next(o for o in bpy.data.objects if o.type=='MESH');rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
if mesh.data.shape_keys.key_blocks.get('Chew'):raise RuntimeError('Rebuild from life-stage source')
rig.animation_data.action=None;mesh.data.shape_keys.animation_data.action=None
for pb in rig.pose.bones:pb.rotation_quaternion=Quaternion();pb.location=(0,0,0);pb.scale=(1,1,1)
for key in mesh.data.shape_keys.key_blocks:key.value=0
chew=mesh.shape_key_add(name='Chew');lap=mesh.shape_key_add(name='Lap')
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
counts={'Chew':0,'Lap':0};maximum={'Chew':0,'Lap':0}
for v in mesh.data.vertices:
 x,y,z=v.co
 # The fused sculpt is asymmetric. Keep the nose, eyes and upper muzzle fixed.
 mask=(1-smooth(.055,.10,abs(x+.04)))*(1-smooth(-.32,-.25,y))*smooth(.56,.595,z)*(1-smooth(.625,.65,z))
 delta=Vector((0,-.002,-.009))*mask
 chew.data[v.index].co+=delta
 # Tongue-tip motion, feathered into the lower lip rather than pulling the whole face.
 mask=(1-smooth(.018,.047,abs(x+.035)))*(1-smooth(-.35,-.30,y))*smooth(.585,.605,z)*(1-smooth(.625,.64,z))
 tongue=Vector((0,-.009,-.003))*mask
 lap.data[v.index].co+=tongue
 for name,d in [('Chew',delta),('Lap',tongue)]:
  if d.length>1e-6:counts[name]+=1;maximum[name]=max(maximum[name],d.length)
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
 for name in ['Breath','Chew','Lap']:
  if name in names:primitive['targets'][names.index(name)].pop('NORMAL',None)
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

report={'vertices':counts,'maximum_displacement':maximum,'asset_bytes':os.path.getsize(path)}
with open(out+'/care-report.json','w')as f:json.dump(report,f,indent=2)
print('CARE_REPORT',json.dumps(report))
