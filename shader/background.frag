precision mediump float;


#define PI 3.14159265359
// lets grab texcoords just for fun
varying vec2 vTexCoord;

uniform vec2 u_resolution;
uniform vec3 u_color_old;
uniform vec3 u_color;

//uniform vec2 u_devicecamres;
uniform float u_lerp;
uniform float u_lerp2;


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
vec3 old_pix = u_color_old/255.0;

      // the texture is loaded upside down and backwards by default so lets flip it




//vec3 col = lerp(old_pix,pix,vec3(u_lerp));

  // lets invert the colors just for kicks
//  tex.rgb = 1.0 - tex.rgb;

 vec3 colout= mix(pix,1.0 - pix, uv.x);

 //vec3 colfinal = mix(vec3(0.0),colout,u_lerp2);

  gl_FragColor = vec4(colout,1.0);
}



// precision mediump float;
//
// uniform vec2 resolution;
// uniform vec2 mouse;
// uniform float tileno;
// uniform float radius;
// uniform float u_time;
// uniform bool isMobile;
//
//
// const float PI = 3.1415926535897932384626433832795;
//
// // lets grab texcoords just for fun
// varying vec2 vTexCoord;
//
// // our texture coming from p5
// uniform sampler2D tex0;
// //uniform sampler2D tex1; //alphamask
//
//
// // The min and max sizes of the circles (in pixels) over time.
// #define MIN_SIZE 2.0
// #define MAX_SIZE 200.0
//
// // Compute the relative distance to the circle, where < 0.0 is outside the feathered border,
// // and > 1.0 is inside the feathered border.
// float ComputeCircle(vec2 pos, vec2 center, float radius, float feather){
//     // Determine the distance to the center of the circle.
// 	float dist = length(center - pos);
//
//     // Use the distance and the specified feather factor to determine where the distance lies
//     // relative to the circle border.
//     float start = radius - feather;
//     float end   = radius + feather;
//     return smoothstep(start, end, dist);
// }
//
// float box(vec2 _st, vec2 _size, float _smoothEdges){
//     _size = vec2(0.5)-_size*0.5;
//     vec2 aa = vec2(_smoothEdges*0.5);
//     vec2 uv = smoothstep(_size,_size+aa,_st);
//     uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
//     return uv.x*uv.y;
// }
//
// float random(vec2 p)
// {
//     p  = fract( p*0.3183099+.1 );
//     p *= 17.0;
//     return fract( p.x*p.y*(p.x+p.y) );
// }
//
// // The main function, which is executed once per pixel.
// void main()  {
//     // Prepare the circle parameters, cycling the circle size over time.
//     float cycle = clamp(cos(u_time / 2.0) * 0.6 + 0.7, 0.0, 1.0);
//     float diameter = radius;//mix(MAX_SIZE, MIN_SIZE, cycle);
//     float radius = diameter / 2.0;
//     vec2  center = vec2(0.0);
//
//     // Compute the relative distance to the circle, using mod() to repeat the circle across the display.
//     // A feather value (in pixels) is used to reduce aliasing artifacts when the circles are small.
//     // The position is adjusted so that a circle is in the center of the display.
//     vec2 screenPos = gl_FragCoord.xy - (resolution.xy / 2.0) - vec2(radius);
// 		vec2 screenPos2 = gl_FragCoord.xy - (resolution.xy / 2.0);
// 		vec2 screenPos3 = gl_FragCoord.xy/resolution.xy;
//
//
// 		vec2 count = resolution.xy / (diameter);
// 		vec2 shift = vec2(0.5) - fract(count / 2.0);
// 		vec2 uv = floor(count * gl_FragCoord.xy / resolution.xy + shift) / count;
//
//     vec2 pos = mod(screenPos, vec2(diameter)) - vec2(radius);
//
// 	float d2 = ComputeCircle(screenPos2, center, 300.0 , 0.5);
//
// 		float edge = radius/2.0;//random(uv) * radius/2.0; // random sizes // generate different si
//
//     float d = ComputeCircle(pos, center, edge , 0.5); //circles
//
//
//
//
//
// //float d = box(pos, vec2(radius), 0.5); // rectangles
//
//     // Compute "pixelated" (stepped) texture coordinates using the floor() function.
//     // The position is adjusted to match the circles, i.e. so a pixelated block is at the center of the
//     // display.
//   //  vec2 tileNum = floor(vec2(gl_FragCoord.xy)/tileSize);
//   //  vec2 st =  tileNum * tileSize/u_resolution.xy;
//     // vec2 count = resolution.xy / (diameter);
//     // vec2 shift = vec2(0.5) - fract(count / 2.0);
//     // vec2 uv = floor(count * gl_FragCoord.xy / resolution.xy + shift) / count;
//
// 	// Sample the texture, using an offset to the center of the pixelated block.
//    // NOTE: Use a large negative bias to effectively disable mipmapping, which would otherwise lead
//     // to sampling artifacts where the UVs change abruptly at the pixelated block boundaries.
//     uv += vec2(0.5) / count;
//     uv = clamp(uv, 0.0, 0.99);
//
//
// //isMobile == false
//
// float mobiletest = float(isMobile);
//
// // if (x<0.5)
// // {
// //   x=a;
// //   }else{
// //   x=b;
// // }
// //
// // // faster
// // x=a*step(x,0.5)+b*step(0.5,x);
//
// //If conditional statement below equivalent: see example above
//
//
// uv.y = (1.0 -uv.y) * step(mobiletest,0.9) + uv.y * step(0.9,mobiletest);
//
// //uv.y = (mobiletest) - uv.y; // flip UV if on Desktop
//
//
//
//
//
// 	vec3 texColor = texture2D(tex0, uv, -32.0).rgb;
// 	//vec3 alphmask = texture2D(tex1, uv, -32.0).rgb; //pixellate alphamask
//
//
// 	// Calculate the color based on the circle shape, mixing between that color and a background color.
//     // NOTE: Set the mix factor to 0.0 to see the pixelating effect directly, without the circles.
//     vec3 bg  = vec3(1.0, 1.0, 1.0);
// 		//vec3 gr = vec3(0.0,texColor.y,0.0);
//     vec3 col = mix(texColor, bg, (d)); //1.-d for rect
// 		vec3 mask = vec3(d2,d2,d2);
//     vec3 red = vec3(col.x,0.,0.);
//
// 		//float redmask = col.x * step(mask.x,0.99) + 0.0 * step(0.99,mask.x);
// 	vec3 redmask = mix(red,bg,mask.x);
// 	//vec3 texColor2 = texture2D(tex0, vTexCoord).rgb; //need logic to flip uv on Desktop (not need for mobile)
//
//
//     // Set the final fragment color.
// 	  gl_FragColor = vec4(col, 1.0);
// 	// gl_FragColor = vec4(mobiletest,mobiletest,mobiletest, 1.0); //debug
// }
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// // void main() {
// //
// // float aspect = resolution.x / resolution.y;
// //
// // vec3 red = vec3(1.0,0.0,0.0);
// // vec3 green = vec3(0.0,1.0,0.0);
// // vec3 blue = vec3(0.0,0.0,1.0);
// //
// // // copy the vTexCoord
// // // vTexCoord is a value that goes from 0.0 - 1.0 depending on the pixels location
// // // we can use it to access every pixel on the screen
// // vec2 st = vTexCoord;
// // vec2 uv = vTexCoord;
// // uv = 1.0 - uv;
// // st = 1.0 - st;
// //
// // float tiles = tileno;//mouse.x;
// // //uv.x *= aspect;
// // uv = uv * tiles;
// // uv = floor(uv);
// // uv = uv / tiles;
// //
// // vec4 tex = texture2D(tex0, uv);
// //
// // //st.x *= aspect;
// //
// //
// // // lets multiply the coordinates by a factor of 10
// // st *= tiles;
// //
// // // use the fract function so that the values always fluctuate between 0 - 1
// // // fract will return whatever number is to the right of the decimal point
// // // it is built in to glsl
// // st = fract(st);
// //
// // red = vec3(tex.x,0.,0.);
// // green = vec3(0.,tex.y,0.);
// // blue = vec3(0.,0.,tex.z);
// //
// //
// //
// //
// // vec3 circles = vec3(box(st,vec2(radius),0.0));
// // //vec3 circles = vec3(circle(st,radius));
// //
// //
// // vec3 color2 = mix(circles,red, 1./circles.x);
// // vec4 colour = vec4(red, circles.x);
// //
// // gl_FragColor = vec4(color2,1.0);
// //
// //
// //
// // }
