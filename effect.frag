precision mediump float;

// lets grab texcoords just for fun
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;

uniform vec2 u_resolution;
uniform vec2 u_devicecamres;


void main() {

vec2 uv = vTexCoord;

vec2 st = gl_FragCoord.xy;  //centre screen




  float aspect_ratio_ratio = u_resolution.x / u_resolution.y / (u_devicecamres.x / u_devicecamres.y);

    if (aspect_ratio_ratio < 1.0) {
        uv = (st / u_resolution.xy - 0.5) * vec2(aspect_ratio_ratio, 1.0) + 0.5;
    } else {
        uv = (st / u_resolution.xy - 0.5) / vec2(1.0, aspect_ratio_ratio) + 0.5;
    }



      // the texture is loaded upside down and backwards by default so lets flip it
    uv = 1.0 - uv;

  // get the webcam as a vec4 using texture2D
  vec4 tex = texture2D(tex0, uv);

  // lets invert the colors just for kicks
//  tex.rgb = 1.0 - tex.rgb;

  gl_FragColor = tex;
}