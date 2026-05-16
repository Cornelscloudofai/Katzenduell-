'use strict';

window.KATZENBURG_GEOMETRY = (() => {
  function normal(x,y,z){
    const l = Math.hypot(x,y,z) || 1;
    return [x/l, y/l, z/l];
  }

  function makeCylinder(segments=24){
    const verts=[];
    function push(x,y,z,nx,ny,nz){ verts.push(x,y,z,nx,ny,nz); }
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
      // side, local axis Z from -1 to 1
      push(ca,sa,-1,ca,sa,0); push(cb,sb,-1,cb,sb,0); push(cb,sb,1,cb,sb,0);
      push(ca,sa,-1,ca,sa,0); push(cb,sb,1,cb,sb,0); push(ca,sa,1,ca,sa,0);
      // front cap
      push(0,0,1,0,0,1); push(cb,sb,1,0,0,1); push(ca,sa,1,0,0,1);
      // back cap
      push(0,0,-1,0,0,-1); push(ca,sa,-1,0,0,-1); push(cb,sb,-1,0,0,-1);
    }
    return new Float32Array(verts);
  }

  function makeCone(segments=24){
    const verts=[];
    function push(x,y,z,nx,ny,nz){ verts.push(x,y,z,nx,ny,nz); }
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
      const na=normal(ca,sa,.45), nb=normal(cb,sb,.45);
      push(ca,sa,-1,na[0],na[1],na[2]); push(cb,sb,-1,nb[0],nb[1],nb[2]); push(0,0,1,0,0,1);
      push(0,0,-1,0,0,-1); push(ca,sa,-1,0,0,-1); push(cb,sb,-1,0,0,-1);
    }
    return new Float32Array(verts);
  }

  return { makeCylinder, makeCone };
})();
