'use strict';

window.KATZENBURG_MATH = (() => {
  function v3(x=0,y=0,z=0){return [x,y,z]}
  function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
  function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
  function mul(a,s){return [a[0]*s,a[1]*s,a[2]*s]}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
  function len(a){return Math.hypot(a[0],a[1],a[2])||1}
  function norm(a){return mul(a,1/len(a))}

  function smoothstep01(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)}
  function blendRectPlateau(x,z,cx,cz,rx,rz,height,blend=8){
    const dx=Math.abs(x-cx)-rx;
    const dz=Math.abs(z-cz)-rz;
    const ox=Math.max(0,dx), oz=Math.max(0,dz);
    const dist=Math.hypot(ox,oz);
    if(dx<=0 && dz<=0) return height;
    const t=1-smoothstep01(dist/Math.max(0.001,blend));
    return height*Math.max(0,t);
  }
  function bumpHeight(x,z,cx,cz,rx,rz,height){
    const dx=(x-cx)/rx, dz=(z-cz)/rz;
    const d=dx*dx+dz*dz;
    if(d>=1) return 0;
    const t=1-d;
    return height*t*t;
  }

  function mulberry32(a){
    return function(){
      let t=a+=0x6D2B79F5;
      t=Math.imul(t^t>>>15,t|1);
      t^=t+Math.imul(t^t>>>7,t|61);
      return ((t^t>>>14)>>>0)/4294967296;
    };
  }
  function randRange(r,a,b){ return a+(b-a)*r(); }
  function randInt(r,a,b){ return Math.floor(randRange(r,a,b+1)); }
  function pick(r,list){ return list[Math.floor(r()*list.length)]; }

  function m4Identity(){return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]}
  function m4Mul(a,b){
    const o=new Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
    return o;
  }
  function perspective(fovy,aspect,near,far){
    const f=1/Math.tan(fovy/2), nf=1/(near-far);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
  }
  function lookAt(eye,target,up=[0,1,0]){
    const z=norm(sub(eye,target));
    const x=norm(cross(up,z));
    const y=cross(z,x);
    return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  }
  function translate(m,x,y,z){return m4Mul(m,[1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1])}
  function scale(m,x,y,z){return m4Mul(m,[x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1])}
  function rotY(m,a){const c=Math.cos(a),s=Math.sin(a);return m4Mul(m,[c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1])}
  function rotX(m,a){const c=Math.cos(a),s=Math.sin(a);return m4Mul(m,[1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1])}
  function rotZ(m,a){const c=Math.cos(a),s=Math.sin(a);return m4Mul(m,[c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1])}
  function transformPoint(m,p){
    const x=p[0],y=p[1],z=p[2];
    return [
      m[0]*x + m[4]*y + m[8]*z + m[12],
      m[1]*x + m[5]*y + m[9]*z + m[13],
      m[2]*x + m[6]*y + m[10]*z + m[14],
      m[3]*x + m[7]*y + m[11]*z + m[15]
    ];
  }

  return {
    v3, add, sub, mul, dot, cross, len, norm,
    smoothstep01, blendRectPlateau, bumpHeight,
    mulberry32, randRange, randInt, pick,
    m4Identity, m4Mul, perspective, lookAt,
    translate, scale, rotY, rotX, rotZ, transformPoint
  };
})();
