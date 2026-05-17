'use strict';

window.KATZENBURG_WEBGL = (() => {
  function compileShader(gl,type,src){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);
    return shader;
  }

  function createProgram(gl,{ vs, fs }){
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
    return prog;
  }




  function createModelHelpers({ m4Identity, translate, rotY, scale }){
    function modelCube(x,y,z,w,h,d,ry=0){
      let m=m4Identity();
      m=translate(m,x,y+h/2,z);
      m=rotY(m,ry);
      m=scale(m,w/2,h/2,d/2);
      return m;
    }

    function basisModel(center,right,up,forward,sx,sy,sz){
      return [
        right[0]*sx,right[1]*sx,right[2]*sx,0,
        up[0]*sy,up[1]*sy,up[2]*sy,0,
        forward[0]*sz,forward[1]*sz,forward[2]*sz,0,
        center[0],center[1],center[2],1
      ];
    }

    return { modelCube, basisModel };
  }

  const CUBE_VERTS = [
    -1,-1,-1,0,0,-1, 1,-1,-1,0,0,-1, 1,1,-1,0,0,-1, -1,-1,-1,0,0,-1, 1,1,-1,0,0,-1, -1,1,-1,0,0,-1,
    -1,-1,1,0,0,1, 1,1,1,0,0,1, 1,-1,1,0,0,1, -1,-1,1,0,0,1, -1,1,1,0,0,1, 1,1,1,0,0,1,
    -1,-1,-1,-1,0,0, -1,1,-1,-1,0,0, -1,1,1,-1,0,0, -1,-1,-1,-1,0,0, -1,1,1,-1,0,0, -1,-1,1,-1,0,0,
    1,-1,-1,1,0,0, 1,1,1,1,0,0, 1,1,-1,1,0,0, 1,-1,-1,1,0,0, 1,-1,1,1,0,0, 1,1,1,1,0,0,
    -1,1,-1,0,1,0, 1,1,-1,0,1,0, 1,1,1,0,1,0, -1,1,-1,0,1,0, 1,1,1,0,1,0, -1,1,1,0,1,0,
    -1,-1,-1,0,-1,0, 1,-1,1,0,-1,0, 1,-1,-1,0,-1,0, -1,-1,-1,0,-1,0, -1,-1,1,0,-1,0, 1,-1,1,0,-1,0
  ];

  function createPrimitiveRenderer({ gl, loc, m4Mul, makeCylinder, makeCone }){
    const cubeBuf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cubeBuf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(CUBE_VERTS),gl.STATIC_DRAW);

    const cylVerts=makeCylinder(32);
    const cylBuf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cylBuf);
    gl.bufferData(gl.ARRAY_BUFFER,cylVerts,gl.STATIC_DRAW);

    const coneVerts=makeCone(32);
    const coneBuf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,coneBuf);
    gl.bufferData(gl.ARRAY_BUFFER,coneVerts,gl.STATIC_DRAW);

    let sphereBuf=null, sphereVertCount=0;
    function initSphere(){
      if(sphereBuf) return;
      const lat=10, lon=14;
      const data=[];
      const point=(theta,phi)=>{
        const x=Math.sin(theta)*Math.cos(phi);
        const y=Math.cos(theta);
        const z=Math.sin(theta)*Math.sin(phi);
        return [x,y,z,x,y,z];
      };
      for(let y=0;y<lat;y++){
        const t0=y/lat*Math.PI;
        const t1=(y+1)/lat*Math.PI;
        for(let x=0;x<lon;x++){
          const p0=x/lon*Math.PI*2;
          const p1=(x+1)/lon*Math.PI*2;
          const a=point(t0,p0), b=point(t1,p0), c=point(t1,p1), d=point(t0,p1);
          data.push(...a,...b,...c, ...a,...c,...d);
        }
      }
      const arr=new Float32Array(data);
      sphereBuf=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,sphereBuf);
      gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);
      sphereVertCount=arr.length/6;
    }

    function drawBuffer(buf,count,model,color,VP){
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(loc.pos);
      gl.vertexAttribPointer(loc.nor,3,gl.FLOAT,false,24,12);gl.enableVertexAttribArray(loc.nor);
      const mvp=m4Mul(VP,model);
      gl.uniformMatrix4fv(loc.mvp,false,new Float32Array(mvp));
      gl.uniformMatrix4fv(loc.m,false,new Float32Array(model));
      gl.uniform3fv(loc.color,new Float32Array(color));
      gl.drawArrays(gl.TRIANGLES,0,count);
    }

    function drawCube(model,color,VP){drawBuffer(cubeBuf,36,model,color,VP)}
    function drawCylinder(model,color,VP){drawBuffer(cylBuf,cylVerts.length/6,model,color,VP)}
    function drawCone(model,color,VP){drawBuffer(coneBuf,coneVerts.length/6,model,color,VP)}
    function drawSphere(model,color,VP){
      initSphere();
      drawBuffer(sphereBuf,sphereVertCount,model,color,VP);
    }

    return { drawBuffer, drawCube, drawCylinder, drawCone, drawSphere };
  }

  function b64ToFloat32Array(b64){
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for(let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  function getDefaultLocations(gl,prog){
    return {
      pos: gl.getAttribLocation(prog, 'aPos'),
      nor: gl.getAttribLocation(prog, 'aNor'),
      mvp: gl.getUniformLocation(prog, 'uMVP'),
      m: gl.getUniformLocation(prog, 'uM'),
      color: gl.getUniformLocation(prog, 'uColor'),
      light: gl.getUniformLocation(prog, 'uLight')
    };
  }

  return { createProgram, getDefaultLocations, b64ToFloat32Array, createPrimitiveRenderer, createModelHelpers };
})();
