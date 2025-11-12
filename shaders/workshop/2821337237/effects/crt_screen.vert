// [COMBO] {"material":"Perspective","combo":"PERSPECTIVE","type":"options","default":0}

#include "common_perspective.h"

uniform vec2 u_borders; // {"default":"0.5 0.5","group":"Screen","linked":true,"material":"Border size","range":[0,1]}
uniform float u_curvature; // {"material":"Curvature","default":0.5,"range":[0,2],"group":"Screen"}
uniform vec2 g_Point0; // {"default":"0 0","group":"Perspective","label":"p0","material":"point0"}
uniform vec2 g_Point1; // {"default":"1 0","group":"Perspective","label":"p1","material":"point1"}
uniform vec2 g_Point2; // {"default":"1 1","group":"Perspective","label":"p2","material":"point2"}
uniform vec2 g_Point3; // {"default":"0 1","group":"Perspective","label":"p3","material":"point3"}

uniform mat4 g_ModelViewProjectionMatrix;

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec2 v_TexCoord;
varying vec3 v_PerspCoord;

void main() {
	gl_Position = mul(vec4(a_Position, 1.0), g_ModelViewProjectionMatrix);
	v_TexCoord = a_TexCoord;

#if PERSPECTIVE //With perspective
	mat3 xform = inverse(squareToQuad(g_Point0, g_Point1, g_Point2, g_Point3)); //Compute perspective
	v_PerspCoord = mul(vec3(a_TexCoord, 1.0), xform);
#else
	v_PerspCoord = vec3(a_TexCoord, 1.0);
#endif
}