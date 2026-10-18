import bpy,math,os,json,shutil,sys
from mathutils import Vector,Quaternion
out=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/private/tmp/panda-approved';os.makedirs(out,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.65):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;return m
cream=mat('Ivory plush',(.89,.83,.74));dark=mat('Soft charcoal',(.016,.021,.029));inner=mat('Inner ear velvet',(.032,.039,.05));brown=mat('Warm brown eyes',(.23,.105,.035),.22);pupil=mat('Glossy pupils',(.004,.006,.009),.12);glint=mat('Eye highlights',(.98,.98,.96),.15);pink=mat('Warm paw pads',(.58,.32,.30));mouth=mat('Mouth interior',(.07,.014,.022));tongue=mat('Pink tongue',(.65,.17,.20));green=mat('Bamboo green',(.22,.36,.035));node=mat('Bamboo nodes',(.39,.51,.08));leafmat=mat('Fresh leaves',(.14,.30,.025));parts=[]
def uv(name,loc,scale,material,bone):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 parts.append((o,bone));return o
def capsule(name,a,b,r,material,bone):
 a,b=Vector(a),Vector(b);o=uv(name,(a+b)/2,(r,r,(b-a).length/2+r*.65),material,bone);o.rotation_mode='QUATERNION';o.rotation_quaternion=(b-a).to_track_quat('Z','Y');return o
def curve(name,points,r,material,bone):
 bpy.ops.object.select_all(action='DESELECT');c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3;s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for p,v in zip(s.bezier_points,points):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);c.materials.append(material);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');parts.append((o,bone));return o
body=uv('Rounded black torso',(0,.08,.85),(.64,.46,.72),dark,'Body');uv('Cream tummy',(0,-.305,.78),(.49,.18,.57),cream,'Body');uv('Tiny tail',(0,.50,.55),(.14,.14,.14),cream,'Body')
head=uv('Oversized panda head',(0,-.035,1.95),(.76,.60,.69),cream,'Head')
# Flattened patches conform to the head instead of floating as separate eye sockets.
for side in [-1,1]:
 label='L'if side<0 else'R'
 uv(label+' round ear',(side*.59,.015,2.49),(.24,.145,.24),dark,'Head');uv(label+' inner ear',(side*.59,-.105,2.49),(.145,.035,.155),inner,'Head')
 verts=[(side*.28,-.60,2.05)];faces=[];rings=8;segments=40;angle=-side*.28
 # Disk parameterization with radiating rings; all vertices lie on the facial ellipsoid.
 verts=[]
 for j in range(rings+1):
  radius=j/rings
  for i in range(segments):
   a=2*math.pi*i/segments;dx=.175*radius*math.cos(a);dz=.23*radius*math.sin(a);x=side*.27+dx*math.cos(angle)-dz*math.sin(angle);z=2.025+dx*math.sin(angle)+dz*math.cos(angle);y=-.035-.60*math.sqrt(max(.001,1-(x/.76)**2-((z-1.95)/.69)**2))-.008;verts.append((x,y,z))
 for j in range(rings):
  for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
 me=bpy.data.meshes.new(label+' eye patch mesh');me.from_pydata(verts,[],faces);me.update();me.materials.append(dark);o=bpy.data.objects.new(label+' expressive eye patch',me);bpy.context.collection.objects.link(o);parts.append((o,'Head'))
 for p in me.polygons:p.use_smooth=True
 uv(label+' eye rim',(side*.258,-.610,2.035),(.116,.035,.13),inner,'Head');uv(label+' iris',(side*.254,-.638,2.038),(.086,.018,.097),brown,'Head');uv(label+' pupil',(side*.249,-.654,2.043),(.060,.010,.075),pupil,'Head');uv(label+' large eye glint',(side*.249-.024,-.664,2.084),(.027,.006,.029),glint,'Head');uv(label+' small eye glint',(side*.249+.026,-.665,2.023),(.011,.004,.012),glint,'Head')
 uv(label+' soft muzzle',(side*.105,-.590,1.80),(.16,.105,.115),cream,'Head')
blush=mat('Subtle warm cheeks',(.80,.59,.53))
for side in [-1,1]:
 x=side*.405;z=1.855;y=-.035-.60*math.sqrt(1-(x/.76)**2-((z-1.95)/.69)**2)-.006
 o=uv('Soft cheek tint '+str(side),(x,y,z),(.067,.009,.030),blush,'Head');o.rotation_euler.z=-side*.24
uv('Heartlike nose',(0,-.700,1.858),(.092,.055,.055),dark,'Head');uv('Nose highlight',(-.028,-.746,1.881),(.033,.006,.009),inner,'Head')
uv('Happy open mouth',(0,-.594,1.685),(.125,.061,.085),mouth,'Jaw');uv('Little tongue',(0,-.649,1.655),(.066,.012,.028),tongue,'Jaw')
curve('Muzzle center',[(0,-.693,1.818),(0,-.692,1.779),(0,-.664,1.759)],.012,dark,'Head')
for side in [-1,1]:curve('Smile corner '+str(side),[(0,-.663,1.758),(side*.07,-.659,1.75),(side*.12,-.622,1.778)],.010,dark,'Head')
# Seated paws with broad soft pads and four little toe pads.
for side in [-1,1]:
 label='L'if side<0 else'R';uv(label+' seated foot',(side*.49,-.28,.30),(.32,.31,.325),dark,label+'Foot');uv(label+' paw pad',(side*.49,-.565,.265),(.155,.028,.14),pink,label+'Foot')
 for i in range(4):
  a=(i-1.5)*.44;x=side*.49+math.sin(a)*.20;z=.36+math.cos(a)*.12;uv(label+' toe pad '+str(i),(x,-.554,z),(.042,.025,.051),pink,label+'Foot')
# Rounded arms embrace the bamboo, while remaining separate editable pieces.
bones=[('Root',(0,0,.05),(0,0,.50),None),('Body',(0,0,.50),(0,0,1.42),'Root'),('Head',(0,0,1.42),(0,0,2.30),'Body'),('Jaw',(0,-.48,1.76),(0,-.59,1.65),'Head'),('LFoot',(-.35,0,.40),(-.49,-.28,.22),'Root'),('RFoot',(.35,0,.40),(.49,-.28,.22),'Root')]
for label,shoulder,elbow,wrist in [('L',(-.49,.00,1.27),(-.59,-.29,1.06),(-.05,-.72,1.12)),('R',(.49,0,1.27),(.65,-.28,1.15),(.19,-.69,1.49))]:
 bones.extend([(label+'Upper',shoulder,elbow,'Body'),(label+'Forearm',elbow,wrist,label+'Upper'),(label+'Paw',wrist,Vector(wrist)+Vector((0,-.06,.07)),label+'Forearm')])
 capsule(label+' upper arm',shoulder,elbow,.20,dark,label+'Upper');capsule(label+' forearm',elbow,wrist,.18,dark,label+'Forearm');uv(label+' hand',wrist,(.17,.14,.16),dark,label+'Paw')
 for i in range(3):uv(label+' finger '+str(i),(wrist[0]-.07+i*.07,wrist[1]-.10,wrist[2]+.04),(.046,.056,.065),dark,label+'Paw')
# A detachable prop bone lets the app replace or hide bamboo later.
start=Vector((-.08,-.72,.64));end=Vector((.16,-.72,1.73));direction=(end-start).normalized();bones.append(('Bamboo',start,end,'LPaw'))
bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.075,depth=(end-start).length,location=(start+end)/2);o=bpy.context.object;o.name='Bamboo stalk';o.rotation_mode='QUATERNION';o.rotation_quaternion=direction.to_track_quat('Z','Y');o.data.materials.append(green);parts.append((o,'Bamboo'))
bevel=o.modifiers.new('Soft bamboo edges','BEVEL');bevel.width=.018;bevel.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
for t in [.06,.36,.68,.97]:
 pos=start+(end-start)*t;bpy.ops.mesh.primitive_torus_add(major_radius=.076,minor_radius=.012,major_segments=32,minor_segments=8,location=pos);o=bpy.context.object;o.name='Bamboo joint';o.rotation_mode='QUATERNION';o.rotation_quaternion=direction.to_track_quat('Z','Y');o.data.materials.append(node);parts.append((o,'Bamboo'))
for side,t in [(-1,.22),(1,.37),(-1,.62)]:
 origin=start+(end-start)*t;tip=origin+Vector((side*.34,-.015,.16));middle=(origin+tip)/2;verts=[origin,middle+Vector((0,-.01,.075)),tip,middle-Vector((0,-.01,.045))];me=bpy.data.meshes.new('Leaf');me.from_pydata(verts,[],[(0,1,2,3)]);me.materials.append(leafmat);o=bpy.data.objects.new('Bamboo leaf',me);bpy.context.collection.objects.link(o);parts.append((o,'Bamboo'));mod=o.modifiers.new('Leaf thickness','SOLIDIFY');mod.thickness=.007;curve('Leaf midrib',[origin,middle,tip],.006,node,'Bamboo')
# Bone weights are explicit, giving a predictable reusable rig.
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Bamboo Buddy rig';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
for name,a,b,parent in bones:
 eb=rig.data.edit_bones.new(name);eb.head=a;eb.tail=b
 if parent:eb.parent=rig.data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
for obj,name in parts:
 world=obj.matrix_world.copy();obj.parent=rig;obj.matrix_world=world
 group=obj.vertex_groups.new(name=name);group.add(list(range(len(obj.data.vertices))),1,'REPLACE');mod=obj.modifiers.new('Panda skeleton','ARMATURE');mod.object=rig
for p in rig.pose.bones:p.rotation_mode='QUATERNION'
scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=91
rig.animation_data_create()
def reset():
 for p in rig.pose.bones:p.rotation_quaternion=Quaternion();p.location=(0,0,0);p.scale=(1,1,1)
def key(frame):
 for p in rig.pose.bones:p.keyframe_insert('rotation_quaternion',frame=frame);p.keyframe_insert('location',frame=frame)
def action(name,kind):
 rig.animation_data.action=bpy.data.actions.new(name);rig.animation_data.action.use_fake_user=True
 for frame in range(1,92,3):
  reset();u=(frame-1)/90
  if kind=='idle':rig.pose.bones['Head'].rotation_quaternion=Quaternion((0,1,0),math.sin(u*math.pi*2)*.055);rig.pose.bones['Body'].location.z=.008*(1-math.cos(u*math.pi*2))
  else:
   envelope=math.sin(math.pi*u)**2;rig.pose.bones['Head'].rotation_quaternion=Quaternion((1,0,0),.045*envelope);rig.pose.bones['Jaw'].rotation_quaternion=Quaternion((1,0,0),.16*(.5-.5*math.cos(u*math.pi*12))*envelope)
  key(frame)
 reset();key(91)
 # Muted NLA entries preserve all clips for export without playing them together.
 clip=rig.animation_data.action;track=rig.animation_data.nla_tracks.new();track.name=name;track.mute=True;track.strips.new(name,1,clip);rig.animation_data.action=None
for name,kind in [('SeatedIdle','idle'),('Nibble','nibble')]:action(name,kind)
rig.animation_data.action=bpy.data.actions['SeatedIdle'];scene.frame_set(1)
# Preview-only studio.
studio=bpy.data.collections.new('Preview studio');scene.collection.children.link(studio)
for loc,power,size in [((3,-4,5),450,4),((-3,-2,3),300,3),((0,3,4),500,3)]:
 d=bpy.data.lights.new('Softbox','AREA');d.energy=power;d.size=size;o=bpy.data.objects.new('Softbox',d);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1.3))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Preview camera');c=bpy.data.objects.new('Preview camera',d);studio.objects.link(c);scene.camera=c;c.data.type='ORTHO';c.data.ortho_scale=3.22;c.location=(3,-8,3.0);c.rotation_euler=(Vector((0,-.05,1.30))-c.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False;scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.25,.29,.32,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.35;scene.view_settings.view_transform='AgX';bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=out+'/Bamboo-Buddy-Panda.blend')
for name in ['Panda-preview','Panda-front']:
 if name=='Panda-front':c.location=(0,-8,2.7);c.rotation_euler=(Vector((0,-.05,1.30))-c.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=out+'/'+name+'.png';bpy.ops.render.render(write_still=True)
# Export the character and props only; studio lights and cameras stay in Blender.
rig.animation_data.action=None;reset();scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for obj,_ in parts:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=out+'/panda.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_force_sampling=True)
shutil.copyfile(__file__,out+'/create-panda.py')
print('PANDA_SAVED',out,'bones',len(bones),'meshes',len(parts))
