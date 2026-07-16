/* WebGL background: slow ink currents in deep pine, brass glints */
(function () {
  const canvas = document.getElementById('ink');
  const gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) return;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision mediump float;
uniform vec2 r;uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;
  for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;vec2 q=uv*vec2(r.x/r.y,1.);
  float T=t*.03;
  vec2 w=vec2(fbm(q*1.6+vec2(T,-T*.6)),fbm(q*1.6+vec2(-T*.4,T)));
  float f=fbm(q*2.2+w*1.8);
  vec3 ink=vec3(.039,.082,.071);
  vec3 pine=vec3(.086,.180,.145);
  vec3 brass=vec3(.788,.663,.416);
  vec3 c=mix(ink,pine,smoothstep(.25,.85,f));
  c+=brass*pow(smoothstep(.72,.98,f),3.)*.16;          /* faint glints */
  c*=1.-.55*length(uv-vec2(.5,.42));                    /* vignette */
  gl_FragColor=vec4(c,1.);
}`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');

  function resize() {
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uR, canvas.width, canvas.height);
  }
  addEventListener('resize', resize);
  resize();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(ms) {
    gl.uniform1f(uT, ms * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
