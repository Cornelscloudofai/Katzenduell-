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

  return { createProgram, getDefaultLocations, b64ToFloat32Array };
})();
