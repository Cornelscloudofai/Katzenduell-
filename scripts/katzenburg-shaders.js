'use strict';

window.KATZENBURG_SHADERS = {
  vs: `attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uMVP;uniform mat4 uM;varying vec3 vNor;varying vec3 vPos;void main(){vNor=mat3(uM)*aNor;vPos=(uM*vec4(aPos,1.0)).xyz;gl_Position=uMVP*vec4(aPos,1.0);}`,
  fs: `precision mediump float;varying vec3 vNor;varying vec3 vPos;uniform vec3 uColor;uniform vec3 uLight;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
void main(){
  vec3 n=normalize(vNor);
  float d=max(dot(n,normalize(uLight)),0.0);
  float rim=pow(1.0-max(dot(n,vec3(0.0,0.0,1.0)),0.0),2.0)*.08;
  float grain=hash(floor(vPos.xz*1.8));
  float bands=sin(vPos.y*8.0+vPos.x*.7)*.03;
  float a=.38;
  vec3 col=uColor*(a+d*.70+rim);
  col*=.90+grain*.12+bands;

  // Boden: dezenter Tile-Look
  if(uColor.g>uColor.r && uColor.g>uColor.b && vPos.y<0.25){
    vec2 g=fract(vPos.xz*0.34);
    float mortar=max(step(g.x,0.04),step(g.y,0.04));
    float chk=mod(floor(vPos.x*0.34)+floor(vPos.z*0.34),2.0);
    col*=mix(0.94,1.06,chk);
    col=mix(col,col*0.62,mortar*0.35);
  }

  // Stein/Mauer: Bruchstein-/Ziegel-Eindruck
  if(abs(uColor.r-uColor.g)<0.15 && abs(uColor.g-uColor.b)<0.15 && vPos.y>0.2){
    float row=floor(vPos.y*0.95);
    float off=mod(row,2.0)*0.5;
    vec2 brick=fract(vec2(vPos.x*0.42 + off, vPos.y*0.82));
    float mortar=max(step(brick.x,0.06),step(brick.y,0.09));
    float stone=hash(floor(vPos.xy*2.2));
    col*=0.92+stone*0.13;
    col=mix(col,col*0.60,mortar*0.38);
  }

  float fog=clamp((length(vPos.xz)-24.0)/115.0,0.0,.48);
  col=mix(col,vec3(.10,.20,.32),fog);
  gl_FragColor=vec4(col,1.0);
}`
};
