import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const socket = io();
const game = document.getElementById("game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc9a5);
scene.fog = new THREE.Fog(0x9bc9a5, 90, 260);
const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, .1, 600);
camera.position.set(0, 35, 25);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
game.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f6ff,0x52613d,2.1));
const sun = new THREE.DirectionalLight(0xffedc4,2.5); sun.position.set(-55,90,45); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-120; sun.shadow.camera.right=120; sun.shadow.camera.top=120; sun.shadow.camera.bottom=-120; scene.add(sun);

const mat = (color, roughness=1) => new THREE.MeshStandardMaterial({color,roughness});
const mats = {grass:mat(0x75ad69),darkGrass:mat(0x548b58),sand:mat(0xc9ae76),snow:mat(0xdce8e9),water:new THREE.MeshStandardMaterial({color:0x4ca6bd,roughness:.25,metalness:.15}),wood:mat(0x755039),leaf:mat(0x39764c),leaf2:mat(0x6c9b52),stone:mat(0x8b9990),path:mat(0xb4a078)};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1100,1100),mats.grass); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const zones = [
 {name:"초원",x:0,z:0,r:90,color:0x75ad69,emoji:"🌿"},
 {name:"햇살 사막",x:170,z:40,r:78,color:0xc9ae76,emoji:"🏜️"},
 {name:"속삭임 숲",x:-170,z:-30,r:82,color:0x548b58,emoji:"🌲"},
 {name:"얼음 호수",x:30,z:190,r:82,color:0xdce8e9,emoji:"❄️"},
 {name:"달빛 언덕",x:-190,z:190,r:75,color:0x8a8eb5,emoji:"🌙"}
];
function disc(x,z,r,material){const m=new THREE.Mesh(new THREE.CircleGeometry(r,64),material);m.rotation.x=-Math.PI/2;m.position.set(x,.035,z);m.receiveShadow=true;scene.add(m)}
zones.slice(1).forEach((z,i)=>disc(z.x,z.z,z.r,i===0?mats.sand:i===1?mats.darkGrass:i===2?mats.snow:mat(0x8990b7)));
function tree(x,z,s=1,kind=0){
 const g=new THREE.Group();g.position.set(x,0,z);
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.36*s,2.3*s,7),mats.wood);trunk.position.y=1.15*s;trunk.castShadow=true;g.add(trunk);
 const crown=new THREE.Mesh(new THREE.ConeGeometry(1.45*s,3.3*s,8),kind?mats.leaf2:mats.leaf);crown.position.y=3.15*s;crown.castShadow=true;g.add(crown);scene.add(g);
}
function rock(x,z,s){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),mats.stone);m.position.set(x,s*.5,z);m.scale.y=.65;m.castShadow=true;scene.add(m)}
// Forest clusters, scattered trees and landmarks
for(let i=0;i<150;i++){let x=-170+(Math.random()-.5)*145,z=-30+(Math.random()-.5)*145;if(Math.hypot(x+170,z+30)<77)tree(x,z,.65+Math.random()*.9,i%3===0?1:0)}
for(let i=0;i<65;i++){let x=(Math.random()-.5)*520,z=(Math.random()-.5)*520;if(Math.hypot(x,z)>42)tree(x,z,.55+Math.random()*.65,i%4===0?1:0)}
for(let i=0;i<45;i++){let x=(Math.random()-.5)*500,z=(Math.random()-.5)*500;rock(x,z,.4+Math.random()*1.2)}
// lake, paths, bridge and oasis
const lake=new THREE.Mesh(new THREE.CircleGeometry(31,64),mats.water);lake.rotation.x=-Math.PI/2;lake.position.set(32,.08,188);lake.scale.set(1.25,1,1);scene.add(lake);
const path1=new THREE.Mesh(new THREE.PlaneGeometry(9,430),mats.path);path1.rotation.x=-Math.PI/2;path1.position.set(0,.055,0);scene.add(path1);
const path2=new THREE.Mesh(new THREE.PlaneGeometry(430,8),mats.path);path2.rotation.x=-Math.PI/2;path2.position.set(0,.056,0);scene.add(path2);
function sign(x,z,label){const g=new THREE.Group();g.position.set(x,0,z);const post=new THREE.Mesh(new THREE.BoxGeometry(.25,2.8,.25),mats.wood);post.position.y=1.4;g.add(post);const board=new THREE.Mesh(new THREE.BoxGeometry(3.6,.85,.22),mat(0x67472f));board.position.y=2.45;g.add(board);const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;const c=canvas.getContext("2d");c.fillStyle="#f7e8bd";c.font="bold 48px sans-serif";c.textAlign="center";c.fillText(label,256,82);const tex=new THREE.CanvasTexture(canvas);const face=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.7),new THREE.MeshBasicMaterial({map:tex,transparent:true}));face.position.set(0,2.45,.125);g.add(face);scene.add(g)}
sign(0,-13,"HORSE WORLD");sign(168,5,"DESERT");sign(-170,-100,"FOREST");sign(30,145,"ICE LAKE");

// Horse made from low-poly primitives
function makeHorse(color=0x9b6040){
 const group=new THREE.Group(), coat=mat(color), dark=mat(0x38251e), mane=mat(0x2b201c), hoof=mat(0x302d2b);
 const sphere=(r,sc,pos,material)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,9),material);m.scale.set(...sc);m.position.set(...pos);m.castShadow=true;group.add(m);return m};
 sphere(.72,[1.05,.82,1.55],[0,1.25,0],coat);
 sphere(.43,[.78,.72,.7],[0,1.8,-.72],coat);
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.27,.4,1.35,9),coat);neck.position.set(0,2.12,-.83);neck.rotation.x=-.45;neck.castShadow=true;group.add(neck);
 sphere(.34,[.66,.62,.75],[0,2.8,-1.2],coat);
 sphere(.22,[.72,.4,.55],[0,2.58,-1.52],coat);
 for(const side of [-1,1]){
   sphere(.065,[.7,1,1],[side*.22,2.91,-1.48],dark);
   const ear=new THREE.Mesh(new THREE.ConeGeometry(.12,.48,6),coat);ear.position.set(side*.2,3.17,-1.08);ear.rotation.z=side*.22;group.add(ear);
 }
 const maneMesh=new THREE.Mesh(new THREE.ConeGeometry(.32,1.15,7),mane);maneMesh.position.set(0,3.1,-.95);maneMesh.rotation.x=-.35;group.add(maneMesh);
 const legs=[];
 for(const x of [-.42,.42])for(const z of [-.5,.58]){
  const leg=new THREE.Group();leg.position.set(x,1.05,z);
  const upper=new THREE.Mesh(new THREE.CylinderGeometry(.12,.105,.75,8),coat);upper.position.y=-.35;upper.castShadow=true;leg.add(upper);
  const lower=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.48,8),coat);lower.position.set(0,-.85,.02);lower.castShadow=true;leg.add(lower);
  const h=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.17,8),hoof);h.position.set(0,-1.15,.03);leg.add(h);group.add(leg);legs.push(leg);
 }
 const tail=new THREE.Mesh(new THREE.ConeGeometry(.18,.95,7),mane);tail.position.set(0,1.45,1.05);tail.rotation.x=-.35;group.add(tail);
 group.userData.legs=legs;return group;
}
const local = {id:null,name:"",x:0,z:0,rot:0,mesh:makeHorse(0x9b6040),moving:false,jump:0};
scene.add(local.mesh);
const others=new Map();
function addOther(p){if(p.id===local.id)return;removeOther(p.id);const h=makeHorse(parseInt((p.color||"#b96f45").slice(1),16));h.position.set(p.x,0,p.z);h.rotation.y=p.rot||0;scene.add(h);const label=makeNameTag(p.name);h.add(label);others.set(p.id,{mesh:h,data:p})}
function makeNameTag(name){const c=document.createElement("canvas");c.width=512;c.height=128;const ctx=c.getContext("2d");ctx.fillStyle="rgba(15,30,22,.78)";ctx.roundRect(15,15,482,98,24);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 43px sans-serif";ctx.textAlign="center";ctx.fillText(name,256,79);const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));s.scale.set(4.3,1.08,1);s.position.y=4.2;return s}
function removeOther(id){const o=others.get(id);if(o){scene.remove(o.mesh);others.delete(id)}}

const keys={};let running=false, mobile={x:0,y:0}, drag=null, cameraYaw=0,cameraZoom=1;
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault();if(e.code==="Space"&&local.jump<=0)local.jump=1});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
document.getElementById("run").addEventListener("pointerdown",()=>running=true);
document.getElementById("run").addEventListener("pointerup",()=>running=false);
document.getElementById("run").addEventListener("pointerleave",()=>running=false);
document.getElementById("jump").addEventListener("pointerdown",()=>{if(local.jump<=0)local.jump=1});
const stick=document.getElementById("stick"),knob=document.getElementById("knob");
stick.addEventListener("pointerdown",e=>{stick.setPointerCapture(e.pointerId);moveStick(e)});
stick.addEventListener("pointermove",e=>{if(e.buttons)moveStick(e)});
function moveStick(e){const r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.min(38,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);mobile.x=Math.cos(a)*len/38;mobile.y=Math.sin(a)*len/38;knob.style.transform=`translate(${mobile.x*38}px,${mobile.y*38}px)`}
function resetStick(){mobile={x:0,y:0};knob.style.transform=""}
stick.addEventListener("pointerup",resetStick);stick.addEventListener("pointercancel",resetStick);
renderer.domElement.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse")drag={x:e.clientX,y:e.clientY}});
addEventListener("pointerup",()=>drag=null);
addEventListener("pointermove",e=>{if(drag){cameraYaw-=(e.clientX-drag.x)*.006;drag={x:e.clientX,y:e.clientY}}});
addEventListener("wheel",e=>{cameraZoom=Math.max(.65,Math.min(1.7,cameraZoom+e.deltaY*.001))},{passive:true});

function zoneAt(x,z){let best=zones[0];for(const q of zones.slice(1))if(Math.hypot(x-q.x,z-q.z)<q.r)best=q;return best}
let lastSend=0,lastZone="";
function tick(dt){
 let ix=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+mobile.x;
 let iz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+mobile.y;
 const len=Math.hypot(ix,iz);if(len>1){ix/=len;iz/=len}
 const isRun=running||keys.shift;const speed=isRun?17:9;
 if(len>.08){const dx=ix*Math.cos(cameraYaw)+iz*Math.sin(cameraYaw),dz=-ix*Math.sin(cameraYaw)+iz*Math.cos(cameraYaw);local.x+=dx*speed*dt;local.z+=dz*speed*dt;local.rot=Math.atan2(dx,dz);local.moving=true}else local.moving=false;
 local.mesh.position.set(local.x,0,local.z);local.mesh.rotation.y=local.rot;
 if(local.jump>0){local.jump=Math.max(0,local.jump-dt*1.65);local.mesh.position.y=Math.sin((1-local.jump)*Math.PI)*2.2}
 const legs=local.mesh.userData.legs;legs.forEach((l,i)=>{l.rotation.x=local.moving?Math.sin(performance.now()*.012+i*Math.PI)*.55:Math.sin(performance.now()*.002+i)*.025});
 for(const o of others.values()){const m=o.mesh,d=o.data;m.position.x=THREE.MathUtils.damp(m.position.x,d.x,9,dt);m.position.z=THREE.MathUtils.damp(m.position.z,d.z,9,dt);m.rotation.y=d.rot||0;o.mesh.userData.legs.forEach((l,i)=>l.rotation.x=d.moving?Math.sin(performance.now()*.012+i*Math.PI)*.5:0)}
 const z=zoneAt(local.x,local.z);if(z.name!==lastZone){lastZone=z.name;document.getElementById("zone").textContent=`${z.emoji} ${z.name} 지대`;toast(`${z.name} 지역에 도착했습니다!`)}
 const target=new THREE.Vector3(local.x,0,local.z);
 const dist=42*cameraZoom, height=49*cameraZoom;
 const desired=new THREE.Vector3(local.x+Math.sin(cameraYaw)*dist,height,local.z+Math.cos(cameraYaw)*dist);
 camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(target);
 if(performance.now()-lastSend>65){socket.emit("move",{x:local.x,z:local.z,rot:local.rot,moving:local.moving,zone:z.name});lastSend=performance.now()}
}
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity=0,1800)}
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);tick(dt);renderer.render(scene,camera)}
animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

// Chat + multiplayer connection
const messages=document.getElementById("messages");
function addMessage(html,cls=""){const d=document.createElement("div");d.className="msg "+cls;d.innerHTML=html;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;while(messages.children.length>80)messages.removeChild(messages.firstChild)}
document.getElementById("chatform").addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("chatinput");if(input.value.trim()){socket.emit("chat",input.value.trim());input.value=""}});
socket.on("connect",()=>document.getElementById("reconnect").style.display="none");
socket.on("disconnect",()=>document.getElementById("reconnect").style.display="grid");
socket.on("welcome",data=>{local.id=data.id;data.players.forEach(addOther);document.getElementById("online").textContent=data.players.length});
socket.on("playerJoined",p=>addOther(p));
socket.on("playerMoved",p=>{const o=others.get(p.id);if(o)o.data=p;else addOther(p)});
socket.on("playerLeft",removeOther);
socket.on("onlineCount",n=>document.getElementById("online").textContent=n);
socket.on("chatMessage",m=>addMessage(`<b>${escapeHtml(m.name)}</b>${escapeHtml(m.text)}`));
socket.on("systemMessage",m=>addMessage(escapeHtml(m.text),"sys"));
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
document.getElementById("enter").addEventListener("click",join);
document.getElementById("nickname").addEventListener("keydown",e=>{if(e.key==="Enter")join()});
function join(){const name=document.getElementById("nickname").value.trim().slice(0,14);if(!name){toast("닉네임을 입력해 주세요!");return}local.name=name;document.getElementById("myname").textContent=name;document.getElementById("join").style.display="none";socket.emit("join",{name,x:(Math.random()-.5)*12,z:(Math.random()-.5)*12});}
