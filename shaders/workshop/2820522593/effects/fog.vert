// [COMBO] {"material":"Lighting","combo":"LIGHTING","type":"options","default":0}

#include "common_vertex.h"

#if LIGHTING
uniform mat4 g_ModelMatrix;
uniform mat3 g_NormalModelMatrix;
uniform mat4 g_ViewProjectionMatrix;
uniform vec3 g_EyePosition;
uniform vec3 g_LightsPosition[4];
uniform vec3 g_LightAmbientColor;
uniform vec3 g_LightSkylightColor;
#else
uniform mat4 g_ModelViewProjectionMatrix;
#endif

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec2 v_TexCoord;
#if LIGHTING
varying vec3 v_Normal;
varying vec4 v_Light0DirectionL3X;
varying vec4 v_Light1DirectionL3Y;
varying vec4 v_Light2DirectionL3Z;
#endif

void main() {
#if LIGHTING
	vec3 localPos = a_Position;
	vec3 normal = vec3(0, 0, 1.0);
	vec3 tangent = vec3(1.0, 0, 0);
	vec4 worldPos = mul(vec4(localPos, 1.0), g_ModelMatrix);
	v_TexCoord.xy = a_TexCoord;

	v_Light0DirectionL3X.xyz = g_LightsPosition[0] - worldPos.xyz;
	v_Light1DirectionL3Y.xyz = g_LightsPosition[1] - worldPos.xyz;
	v_Light2DirectionL3Z.xyz = g_LightsPosition[2] - worldPos.xyz;
	vec3 l3 = g_LightsPosition[3] - worldPos.xyz;

	gl_Position = mul(worldPos, g_ViewProjectionMatrix);
	v_Normal = normalize(mul(normal, g_NormalModelMatrix));

	v_Light0DirectionL3X.w = l3.x;
	v_Light1DirectionL3Y.w = l3.y;
	v_Light2DirectionL3Z.w = l3.z;
#else
	gl_Position = mul(vec4(a_Position, 1.0), g_ModelViewProjectionMatrix);
	v_TexCoord.xy = a_TexCoord;
#endif
}