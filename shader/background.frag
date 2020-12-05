precision mediump float;


#define PI 3.14159265359
// lets grab texcoords just for fun
varying vec2 vTexCoord;

uniform vec2 u_resolution;
uniform vec3 u_color;

//uniform vec2 u_devicecamres;
//uniform float u_lerp2;


vec3 lerp(vec3 from, vec3 to, vec3 rel){
  return ((vec3(1.0) - rel) * from) + (rel * to);
}

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

 vec3 colout= mix(pix,1.0 - pix, uv.x);

 //vec3 colfinal = mix(vec3(0.0),colout,u_lerp2);

  gl_FragColor = vec4(colout,1.0);
}
