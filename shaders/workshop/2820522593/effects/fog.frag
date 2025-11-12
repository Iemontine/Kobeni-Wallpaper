// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":0}
// [COMBO] {"material":"Invert opacity mask","combo":"INVERT","type":"options","default":0}
// [COMBO] {"material":"Lighting","combo":"LIGHTING","type":"options","default":0}
// [COMBO] {"material":"Adjust depth levels ","combo":"DEPTHLEVELS","type":"options","default":0}
// [COMBO] {"material":"Noise","combo":"NOISE","type":"options","default":0,"options":{"None":0,"1":1,"2":2}}
// [COMBO] {"material":"Preserve highlights","combo":"RETAINLIGHTS","type":"options","default":1}

#include "common_blending.h"
#include "common_pbr.h"

uniform float g_Time;
#if LIGHTING
uniform vec4 g_LightsColorPremultiplied[3];
uniform vec3 g_LightAmbientColor;
uniform float g_Metallic; // {"material":"Metal","default":0,"range":[0,1]}
uniform float g_Roughness; // {"material":"Rough","default":1,"range":[0,1]}
uniform float g_Light; // {"material":"Light","default":1,"range":[0,1]}
#endif

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"combo":"OPACITY","default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform sampler2D g_Texture2; // {"combo":"DEPTH","default":"util/white","format":"r8","label":"ui_editor_properties_depth_map","mode":"depth","paintdefaultcolor":"1 1 1 1"}
uniform float u_apha; // {"material":"Opacity","default":1,"range":[0,1]}
uniform float u_density; // {"material":"Density","default":1,"range":[0,3]}
uniform float u_brightness; // {"material":"Brightness","default":1,"range":[0,2]}
uniform float u_multiplier; // {"material":"Depth levels multiplier","default":1,"range":[0,2]}
uniform float u_exponent; // {"material":"Depth levels exponent","default":1,"range":[0,2]}
uniform float u_offset; // {"material":"Depth levels offset","default":0,"range":[0,2]}
uniform vec2 u_noise1Offset; // {"default":"0 0","linked":true,"material":"Noise 1 offset","range":[0,10]}
uniform float u_noise1Scale; // {"material":"Noise 1 scale","default":1,"range":[0,2]}
uniform vec2 u_noise2Offset; // {"default":"0 0","linked":true,"material":"Noise 2 offset","range":[0,10]}
uniform float u_noise2Scale; // {"material":"Noise 2 scale","default":1,"range":[0,2]}
uniform float u_noise1Magnitude; // {"material":"Noise 1 magnitude","default":0.5,"range":[0,1]}
uniform float u_noise2Magnitude; // {"material":"Noise 2 magnitude","default":0.5,"range":[0,1]}
uniform vec3 u_color; // {"default":"1 1 1","material":"Fog color","type":"color"}

varying vec2 v_TexCoord;
#if LIGHTING
varying vec4 v_Light0DirectionL3X;
varying vec4 v_Light1DirectionL3Y;
varying vec4 v_Light2DirectionL3Z;
varying vec3 v_LightAmbientColor;
#endif

#define densityValue pow(1.0 / u_density, 2.2)

vec3 permute (vec3 x) {return mod(((x * 34.0) + 1.0) * x, 289.0);}
vec3 taylorInvSqrt(vec3 r) {return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec2 P) {
  const vec2 C = vec2(0.211324865405187134, 0.366025403784438597);
// First corner
  vec2 i = floor(P + dot(P, C.yy));
  vec2 x0 = P - i + dot(i, C.xx);
// Other corners
  vec2 i1;
  i1.x = step(x0.y, x0.x);
  i1.y = 1.0 - i1.x;
  vec4 x12 = x0.xyxy + vec4(C.xx, C.xx * 2.0 - 1.0);
  x12.xy -= i1;
// Permutations
  i = mod(i, 289.0); // Avoid truncation in polynomial evaluation
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
// Circularly symmetric blending kernel
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
// Gradients from 41 points on a line, mapped onto a diamond
  vec3 x = frac(p * (1.0 / 41.0)) * 2.0 - 1.0;
  vec3 gy = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 gx = x - ox;
// Normalise gradient simplicitly by scaling m
  m *= taylorInvSqrt(gx * gx + gy * gy);
// Compute final noise value at P
  vec3 g;
  g.x = gx.x * x0.x + gy.x * x0.y;
  g.yz = gx.yz * x12.xz + gy.yz * x12.yw;
// Scale output to span range [-1, 1]
// (scaling factor determined by experiments)
  return 130.0 * dot(m, g);
}

void main() {
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord.xy);
	vec4 baseAlbedo = albedo;
	float mask = texSample2D(g_Texture1, v_TexCoord.xy).r;
#if INVERT
  mask = 0.001 + 1.0 - mask;
#else
  mask += 0.001;
#endif

  if (mask > 0.01){
#if RETAINLIGHTS
    float luma = dot(1.0 - pow(albedo * 0.995, 2.2), vec3(0.2126, 0.7152, 0.0722));
#else
    float luma = 1.0;
#endif
#if DEPTHLEVELS
	  float depth = saturate(pow(texSample2D(g_Texture2, v_TexCoord.xy).r, 2.2 * u_exponent) * u_multiplier + u_offset);
#else
    float depth = pow(texSample2D(g_Texture2, v_TexCoord.xy).r, 2.2);
#endif

    float noise1 = 1.0, noise2 = 1.0;
#if NOISE == 1 || NOISE == 2
    noise1 = 1.0 - snoise(vec2(v_TexCoord.xy / (0.01 + u_noise1Scale) + u_noise1Offset / (0.01 + u_noise1Scale))) * u_noise1Magnitude * depth;
#endif
#if NOISE == 2
    noise2 = 1.0 - snoise(vec2(v_TexCoord.xy / (0.01 + u_noise2Scale) / 0.2 + u_noise2Offset / (0.01 + u_noise2Scale))) * u_noise2Magnitude * depth;
#endif

	  float density = exp(-densityValue * depth * noise1 * noise2 / luma);
	  density = 0.001 + saturate(density * mask);

#if LIGHTING
    vec3 normal = normalize(v_Normal);
    vec3 normalizedViewVector = vec3(0, 0, 1);
    vec3 f0 = CAST3(0.04);
    f0 = mix(f0, u_color, g_Metallic);

    vec3 light = ComputePBRLight(normal, v_Light0DirectionL3X.xyz / density, normalizedViewVector, u_color, g_LightsColorPremultiplied[0].rgb * g_Light, f0, g_Roughness, g_Metallic);
    light += ComputePBRLight(normal, v_Light1DirectionL3Y.xyz / density, normalizedViewVector, u_color, g_LightsColorPremultiplied[1].rgb * g_Light, f0, g_Roughness, g_Metallic);
    light += ComputePBRLight(normal, v_Light2DirectionL3Z.xyz / density, normalizedViewVector, u_color, g_LightsColorPremultiplied[2].rgb * g_Light, f0, g_Roughness, g_Metallic);
    light += ComputePBRLight(normal, vec3(v_Light0DirectionL3X.w, v_Light1DirectionL3Y.w, v_Light2DirectionL3Z.w) / density, normalizedViewVector, u_color, vec3(g_LightsColorPremultiplied[0].w, g_LightsColorPremultiplied[1].w, g_LightsColorPremultiplied[2].w) * g_Light, f0, g_Roughness, g_Metallic);

    light += max(CAST3(0.001), g_LightAmbientColor);
    vec3 color = u_color * exp(-1.0 + light) * density;
#else
    vec3 color = u_color;
#endif

	  albedo.rgb = mix(albedo.rgb, color * u_brightness, density);
  }
	albedo.rgb = ApplyBlending(BLENDMODE, baseAlbedo.rgb, albedo.rgb, mask * u_apha);
	gl_FragColor = albedo;
}