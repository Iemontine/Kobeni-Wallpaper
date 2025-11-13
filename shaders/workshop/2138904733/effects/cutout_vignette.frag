// [COMBO] {"material":"Cutout Invert","combo":"INVERT","type":"options","default":0}

#include "common_fragment.h"

uniform float g_Time;

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}

uniform vec3 u_CutOutColor; // {"default":"0 0 0","material":"Cutout Color","type":"color"}

uniform float u_CutOutAlpha; // {"material":"Cutout Alpha", "default":1}
uniform float u_scale;    // {"default":"3","material":"Cutout Scale","range":[-3,50]}

uniform float u_offset;    // {"default":"0.5","material":"Cutout Offset","range":[-1,1]}

uniform float u_smoothstep1;    // {"default":"0.299","material":"Cutout Gradient Value 1 (Fade = 0.1)","range":[-1,1]}

uniform float u_smoothstep2;    // {"default":"0.3","material":"Cutout Gradient Value 2 (Fade = 0.9)","range":[-1,1]}


varying vec3 v_TexCoord;
varying vec2 v_CutUV;

void main() {
vec3 albedo = texSample2D(g_Texture0, v_TexCoord.xy);


// Cut out

float scale = pow(length(abs(v_TexCoord - CAST2(u_offset)) * 1.0), 3.0) * u_scale;
float cutAmount;
#if INVERT == 1
	cutAmount = dot(v_CutUV, v_CutUV) - scale;
	
#else 
	cutAmount = dot(v_CutUV, v_CutUV) + scale;
#endif

	cutAmount = smoothstep(u_smoothstep1, u_smoothstep2, cutAmount) * u_CutOutAlpha;    //0.299, 0.3 Original Biohazard Values 
	albedo = mix(albedo, u_CutOutColor, cutAmount);
	
	gl_FragColor = vec4(albedo, 1);
}





