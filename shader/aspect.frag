precision mediump float;

// lets grab texcoords just for fun
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;

uniform vec2 u_resolution;
uniform vec2 u_devicecamres;
uniform float u_lerp;
uniform float u_safari;


vec3 lerp(vec3 from, vec3 to, vec3 rel){
  return ((vec3(1.0) - rel) * from) + (rel * to);
}


void main() {

vec2 uv = vTexCoord;
vec2 st = gl_FragCoord.xy;  //centre screen

  float aspect_ratio_ratio = u_resolution.x / u_resolution.y / (u_devicecamres.x / u_devicecamres.y);

    if (aspect_ratio_ratio < 1.0) {
        uv = (st / u_resolution.xy - 0.5) * vec2(aspect_ratio_ratio, 1.0) + 0.5;
    } else {
        uv = (st / u_resolution.xy - 0.5) / vec2(1.0, aspect_ratio_ratio) + 0.5;
    }

  uv.y = (1.0 -uv.y) * step(u_safari,0.9) + uv.y * step(0.9,u_safari);


  // get the webcam as a vec4 using texture2D
  vec3 tex = texture2D(tex0,uv).rgb;


  float gamma = 2.2;
  tex.rgb = pow(tex.rgb, vec3(1.0/gamma));

vec3 col = lerp(vec3(0.0),tex,vec3(u_lerp));

  gl_FragColor = vec4(col,u_lerp);
}
