#include "common_vertex.h"

uniform float g_Time;
uniform vec2 g_TexelSize;
uniform float u_CutOutSkew; // {"material":"Cutout Skew", "default":0, "range":[-3, 3]}
uniform float u_SkewShift; // {"material":"Cutout Skew Shift X", "default":0.5, "range":[0, 1]}
uniform float u_SkewWarp; // {"material":"Cutout Skew Shift Y", "default":0.5, "range":[-0.5, 1.5]}
uniform mat4 g_ModelViewProjectionMatrix;

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec3 v_TexCoord;
varying vec2 v_TexelUVRatio;
varying vec2 v_BaseCenterCoords;
varying vec2 v_CutUV;


void main() {
	gl_Position = mul(vec4(a_Position, 1.0), g_ModelViewProjectionMatrix);
	
	//gl_Position = vec4(a_Position, 1.0);
	v_TexCoord.xy = a_TexCoord;
	v_TexCoord.z = v_TexCoord.x + g_Time * 0.04;
	
	v_TexelUVRatio = vec2(g_TexelSize.y / g_TexelSize.x, 1);
	
	
	v_CutUV = vec2(u_SkewShift + dot(vec2(v_TexCoord.y, -0.5), CAST2(u_CutOutSkew)), u_SkewWarp) - v_TexCoord.xy;
}
