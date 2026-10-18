"""Build a conservative head/tail rig on the user's static Pomeranian.
Run: Blender --background SOURCE.blend --python this.py -- OUTPUT_DIRECTORY
The source file is never overwritten. Coordinates are in Blender world space.
"""
import bpy,math,os,sys,json
from mathutils import Vector,Quaternion
output=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/private/tmp/pomeranian-rig'
os.makedirs(output,exist_ok=True)
mesh=next(o for o in bpy.data.objects if o.type=='MESH')
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);mesh.name='PomeranianBody'
# Smooth joins retain rigid face/ear features while allowing a small neck turn.
def smooth(a,b,v):
 t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
def weights(v):
 x,y,z=v
 head=smooth(.46,.67,z)*(1-smooth(-.15,.03,y))
 tail=smooth(.20,.30,y)*smooth(-.055,.055,z-(.72-.5*y))
 tail*=1-head
 return {'Head':head,'Tail':tail,'Body':max(0,1-head-tail)}
armdata=bpy.data.armatures.new('PomeranianSkeleton');rig=bpy.data.objects.new('PomeranianRig',armdata);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;mesh.select_set(False);rig.select_set(True);rig.show_in_front=True
bpy.ops.object.mode_set(mode='EDIT')
for name,head,tail,parent in [
 ('Root',(0,0,.02),(0,0,.20),None),
 ('Body',(0,.10,.32),(0,.05,.56),'Root'),
 ('Head',(0,-.13,.53),(0,-.23,.78),'Body'),
 ('Tail',(0,.39,.47),(0,.32,.64),'Body')]:
 b=armdata.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=armdata.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
for name in ['Body','Head','Tail']:mesh.vertex_groups.new(name=name)
counts={n:0 for n in ['Body','Head','Tail']}
for v in mesh.data.vertices:
 for name,w in weights(v.co).items():
  if w>1e-6:mesh.vertex_groups[name].add([v.index],w,'REPLACE');counts[name]+=1
modifier=mesh.modifiers.new('Companion skin','ARMATURE');modifier.object=rig;modifier.use_deform_preserve_volume=False;mesh.parent=rig
for m in mesh.data.materials:
 if m and m.use_nodes:
  for node in m.node_tree.nodes:
   if node.type=='BSDF_PRINCIPLED':node.inputs['Roughness'].default_value=.85;node.inputs['Metallic'].default_value=0
# Quaternion axes are converted from world to bone-local coordinates.
axes={name:{axis:bone.matrix_local.to_3x3().inverted()@Vector(vec)for axis,vec in [('yaw',(0,0,1)),('tilt',(0,1,0)),('nod',(1,0,0))]}for name,bone in armdata.bones.items()}
for bone in rig.pose.bones:bone.rotation_mode='QUATERNION'
def reset():
 for bone in rig.pose.bones:bone.rotation_quaternion=Quaternion();bone.location=(0,0,0);bone.scale=(1,1,1)
def rotation(name,yaw=0,tilt=0,nod=0):
 a=axes[name];return Quaternion(a['yaw'],math.radians(yaw))@Quaternion(a['tilt'],math.radians(tilt))@Quaternion(a['nod'],math.radians(nod))
clips={
 'Curious':[(1,0,0,0),(15,10,2,0),(35,10,2,0),(55,-10,-2,0),(75,-10,-2,0),(91,0,0,0)],
 'HeadTilt':[(1,0,0,0),(15,0,7,0),(40,0,7,0),(61,0,0,0)],
 'TailWag':[(1,0,0,0),(7,0,0,14),(19,0,0,-14),(31,0,0,14),(43,0,0,-14),(49,0,0,0)],
 'Happy':[(1,0,0,0),(7,4,3,12),(19,-4,-3,-12),(31,4,3,12),(43,-4,-3,-12),(55,0,0,0)],
}
rig.animation_data_create()
for name,keys in clips.items():
 reset();action=bpy.data.actions.new(name=name);rig.animation_data.action=action
 bones=['Tail'] if name=='TailWag' else ['Head','Tail'] if name=='Happy' else ['Head']
 for frame,yaw,tilt,wag in keys:
  for bone in bones:
   pb=rig.pose.bones[bone];pb.rotation_quaternion=rotation(bone,yaw=wag if bone=='Tail' else yaw,tilt=tilt if bone=='Head' else 0)
   pb.keyframe_insert('rotation_quaternion',frame=frame,group=bone)
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);track.mute=True
 action.use_fake_user=True
rig.animation_data.action=None;reset();bpy.context.scene.frame_set(1)
rig['purpose']='Conservative head and tail rig. No leg, mouth or walking animation.'
rig['source']='User-provided pomeranian dog 001.blend; original preserved.'
scene=bpy.context.scene;scene.render.fps=30;scene.frame_end=91
# Record deformation stretch at clip extremes before export.
ratios={}
for name in clips:
 action=bpy.data.actions[name];rig.animation_data.action=action;peak=1
 for frame,*_ in clips[name]:
  scene.frame_set(frame);dg=bpy.context.evaluated_depsgraph_get();evaluated=mesh.evaluated_get(dg);deformed=evaluated.to_mesh()
  for edge in mesh.data.edges:
   a,b=edge.vertices;length=(mesh.data.vertices[a].co-mesh.data.vertices[b].co).length
   if length>.002:peak=max(peak,(deformed.vertices[a].co-deformed.vertices[b].co).length/length)
  evaluated.to_mesh_clear()
 ratios[name]=round(peak,3)
rig.animation_data.action=None;reset();scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output,'pomeranian-rig.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(output,'pomeranian-rigged.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_influence_nb=4,export_force_sampling=True)
with open(os.path.join(output,'rig-report.json'),'w')as f:json.dump({'weighted_vertices':counts,'max_edge_stretch':ratios,'clips':list(clips)},f,indent=2)
# Inspection renders use the same rig and simple softboxes, not app assets.
scene.render.engine='CYCLES';scene.cycles.samples=20;scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100
scene.world.color=(.65,.65,.65)
for o in list(bpy.data.objects):
 if o.type=='LIGHT':bpy.data.objects.remove(o,do_unlink=True)
for loc,power,size in [((2,-3,4),350,4),((-3,-1,2),200,3),((0,3,3),250,3)]:
 d=bpy.data.lights.new('Softbox','AREA');d.energy=power;d.shape='DISK';d.size=size;l=bpy.data.objects.new('Softbox',d);scene.collection.objects.link(l);l.location=loc;l.rotation_euler=(Vector((0,0,.45))-l.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Preview');c=bpy.data.objects.new('Preview',d);scene.collection.objects.link(c);scene.camera=c;d.type='ORTHO';d.ortho_scale=1.15
for name,clip,frame,loc in [('neutral',None,1,(1.7,-3,1)),('head-left','Curious',25,(1.7,-3,1)),('head-right','Curious',65,(1.7,-3,1)),('tilt','HeadTilt',25,(1.7,-3,1)),('tail-left','TailWag',7,(1.7,3,1)),('tail-right','TailWag',19,(1.7,3,1))]:
 reset();rig.animation_data.action=bpy.data.actions[clip]if clip else None;scene.frame_set(frame)
 c.location=loc;c.rotation_euler=(Vector((0,.03,.45))-c.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(output,name+'.png');bpy.ops.render.render(write_still=True)
print('RIG_REPORT',json.dumps({'weighted_vertices':counts,'max_edge_stretch':ratios}))
# Save a useful editable workspace with Happy ready to play on the timeline.
reset();rig.animation_data.action=bpy.data.actions['Happy'];scene.frame_set(1);scene.frame_end=55
c.location=(1.7,-3,1);c.rotation_euler=(Vector((0,.03,.45))-c.location).to_track_quat('-Z','Y').to_euler()
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   space=area.spaces.active;space.shading.type='MATERIAL';space.overlay.show_overlays=False
   space.region_3d.view_location=Vector((0,0,.45));space.region_3d.view_distance=1.8
   space.region_3d.view_rotation=c.rotation_euler.to_quaternion();space.region_3d.view_perspective='PERSP'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output,'pomeranian-rig.blend'))
