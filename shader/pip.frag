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

//uniform vec2 u_devicecamres;
//uniform float u_lerp2;


vec3 lerp(vec3 from, vec3 to, vec3 rel){
  return ((vec3(1.0) - rel) * from) + (rel * to);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
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

  float box(vec2 _st, vec2 _size, float _smoothEdges){
      _size = vec2(0.5)-_size*0.5;
      vec2 aa = vec2(_smoothEdges*0.5);
      vec2 uv = smoothstep(_size,_size+aa,_st);
      uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
      return uv.x*uv.y;
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


  uv -= vec2(0.5);
    // rotate the space
    uv = rotate2d(0.25*PI ) * uv;
    // move it back to the original place
  uv += vec2(0.5);

  st -= pip_pos;
st = scale( vec2(4.0) ) * st;
st += pip_pos;

  vec3 pix = u_color/255.0;

  float mousecirc = ComputeCircle(mousepos,vec2(0.5),radius,1.0);
  float mousecirc2 = ComputeCircle(mousepip,vec2(-10.,-10.),10.,0.5);
  float mousecirc3 = ComputeCircle(mousepip,vec2(-10.,-10.),16.,0.5);

  vec4 mousecol = vec4(texture2D(tex1,vec2(1.0 - u_mouse.x,u_mouse.y)).rgb, 1.0);

  vec4 mousecol2 = vec4(1.0);

  vec4 pip = texture2D(tex1,st).rgba;
  //float b = box(st,vec2(res.x*0.5, res.y)*2.2, 0.01);


  float b = roundBox(st,0.4);

 vec4 bg = vec4(1.0,1.0,1.0,0.0);

 vec4 colout = mix(bg, mousecol, 0.);

vec4 pip2 = mix(pip,mousecol,1.0 - mousecirc2);


 vec4 outc = mix(colout,pip2,b);




//vec3 colfinal = mix(vec3(0.0),colout,u_lerp2);

  gl_FragColor = vec4(outc);
}
