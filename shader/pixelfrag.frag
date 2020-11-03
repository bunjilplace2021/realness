precision mediump float;

uniform vec2 resolution;
uniform vec2 u_mouse;
uniform float tileno;
uniform float radius;
uniform float u_time;


const float PI = 3.1415926535897932384626433832795;

// lets grab texcoords just for fun
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;


float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
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

float lerp(float from, float to, float rel){
  return ((1.0 - rel) * from) + (rel * to);
}

// The main function, which is executed once per pixel.
void main()  {

    float diameter = radius;//mix(MAX_SIZE, MIN_SIZE, cycle);
    float radius = diameter / 2.0;
    vec2  center = vec2(0.0);

    // Compute the relative distance to the circle, using mod() to repeat the circle across the display.
    // A feather value (in pixels) is used to reduce aliasing artifacts when the circles are small.
    // The position is adjusted so that a circle is in the center of the display.
    vec2 screenPos = gl_FragCoord.xy - (resolution.xy / 2.0) - vec2(radius);
		vec2 mousePosition = gl_FragCoord.xy - (resolution.xy) * vec2(u_mouse.x,1.0 - u_mouse.y);
    vec2 st = gl_FragCoord.xy /resolution.xy;

    vec2 pos = mod(screenPos, vec2(diameter)) - vec2(radius);

		//float d = box(pos, vec2(radius/4.0,radius/4.0), 0.5);

		float mousecirc = ComputeCircle(mousePosition,center, 50.0, 1.0);
		float mousecirc2 = ComputeCircle(mousePosition,center, 60.0, 3.0);

  //  float dis =  distance(pos,mousePosition);//abs((1.0 - distance(pos,mousePosition)));

    vec2 sizer = vec2(radius/2.0);

    //sizer = sizer + dis ;

    float d = ComputeCircle(pos, vec2(0.5),sizer.x, 0.5);

    // Compute "pixelated" (stepped) texture coordinates using the floor() function.
    // The position is adjusted to match the circles, i.e. so a pixelated block is at the center of the
    // display.

    vec2 count = resolution.xy / diameter;
    vec2 shift = vec2(0.5) - fract(count / 2.0);
    vec2 uv = floor(count * gl_FragCoord.xy / resolution.xy + shift) / count;

	// Sample the texture, using an offset to the center of the pixelated block.
    // NOTE: Use a large negative bias to effectively disable mipmapping, which would otherwise lead
    // to sampling artifacts where the UVs change abruptly at the pixelated block boundaries.
    uv += vec2(0.5) / count;
    uv = clamp(uv, 0.0, 0.99);
    uv = 1.0 - uv; // flip cam
    vec3 texColor = texture2D(tex0, uv, -32.0).rgb;
		vec3 mouseColor = texture2D(tex0, u_mouse).rgb;

    vec3 bg  = vec3(0.0, 0.0, 0.0);

//float select = lerp(0.3,1.0,mousecirc);

    vec3 col = mix(texColor, bg, d);

	//	vec3 mouseCol = mix(mouseColor,vec3(.5),mousecirc) + (vec3(mousecirc2)*0.5);

	//	vec3 colout = mix(col,mouseCol,1.0-mousecirc2);

//col = vec3(col.r,col.r,col.r);

    // Set the final fragment color.
	   gl_FragColor = vec4(texColor, 1.0);
}
