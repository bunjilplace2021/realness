precision mediump float;


#define PI 3.14159265359
// lets grab texcoords just for fun
varying vec2 vTexCoord;

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec2 u_pip;
uniform vec2 u_pip_mouse;

uniform vec3 u_color;

uniform sampler2D tex1;


mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}



void main() {


vec2 uv =  gl_FragCoord.xy/u_resolution;


  uv -= vec2(0.5);
    // rotate the space
    uv = rotate2d(0.25*PI ) * uv;
    // move it back to the original place
  uv += vec2(0.5);


  vec3 pix = u_color/255.0;



 vec3 bg = mix(pix,1.0 - pix, uv.x);



  gl_FragColor = vec4(bg,1.0);
}
