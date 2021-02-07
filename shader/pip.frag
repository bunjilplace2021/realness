precision mediump float;


#define PI 3.14159265359

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec2 u_pip;
uniform vec2 u_pip_mouse;

uniform vec3 u_color;

uniform sampler2D tex1;


vec3 lerp(vec3 from, vec3 to, vec3 rel){
  return ((vec3(1.0) - rel) * from) + (rel * to);
}

mat2 scale(vec2 _scale){
return mat2(_scale.x,0.0,
0.0,_scale.y);
}

float ComputeCircle(vec2 pos, vec2 center, float radius, float feather){
    // Determine the distance to the center of the circle.
	float dist = length(center - pos);

    // Use the distance and the specified feather factor to determine where the distance lies
    // relative to the circle border.
    float start = radius - feather;
    float end   = radius + feather;
    return smoothstep(start, end, dist);
  }


float roundBox(vec2 _st, float _size){
float d = 0.0;
 _st = _st *2.-1.;
d = length(pow(_st, vec2(4.0)));
  return 1.0 - smoothstep(_size,_size+0.03,d);
}


void main() {

float radius = 50.0;
vec2 uv =  gl_FragCoord.xy/u_resolution;
vec2 mousepos = gl_FragCoord.xy - (u_resolution.xy) * vec2(u_mouse.x,1.0 - u_mouse.y);
vec2 mousepip = gl_FragCoord.xy - (u_resolution.xy) * vec2(u_pip_mouse.x,1.0 - u_pip_mouse.y);
vec2 pip_pos = u_pip;

 vec2 st = uv;
 st = 1.0 - st;

  st -= pip_pos;
st = scale( vec2(4.0) ) * st;
st += pip_pos;


  float mousecirc = ComputeCircle(mousepos,vec2(0.5),radius,1.0);
  float mousecirc2 = ComputeCircle(mousepip,vec2(-10.,-10.),10.,0.5);

  vec4 mousecol = vec4(texture2D(tex1,vec2(1.0 - u_mouse.x,u_mouse.y)).rgb, 1.0);

  vec4 pip = texture2D(tex1,st).rgba;

  float b = roundBox(st,0.4);

 vec4 bg = vec4(0.0);

 vec4 colout = mix(bg, mousecol, 0.);

vec4 pip2 = mix(pip,mousecol,1.0 - mousecirc2);

 vec4 outc = mix(colout,pip2,b);

  gl_FragColor = vec4(outc);
}
