// [COMBO] {"material":"Shadow mask","combo":"SHADOWMASK","type":"options","default":1,"options":{"None":0,"Vertical stripes":1,"Horizontal stripes":2,"Grid":3,"RGB":4}}
// [COMBO] {"material":"Perspective","combo":"PERSPECTIVE","type":"options","default":0}

#include "common.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform float u_noise; // {"material":"Static noise","default":0.5,"range":[0,1],"group":"Imperfections"}
uniform float u_vignette; // {"material":"Vignette","default":1.0,"range":[0,2],"group":"Imperfections"}
uniform vec2 u_borders; // {"default":"0.5 0.5","group":"Screen","linked":true,"material":"Border size","range":[0,1]}
uniform float u_alpha; // {"material":"Opacity","default":1,"range":[0,1]}

uniform float g_Time;
varying vec2 v_TexCoord;
varying vec3 v_PerspCoord;

#define SHADOWMASK_VERTGAPWIDTH 0.3
#define SHADOWMASK_HORIZGAPWIDTH -1.3
#define SHADOWMASK_RCOL_OFFSET 0.0
#define SHADOWMASK_GCOL_OFFSET -0.3
#define SHADOWMASK_BCOL_OFFSET -0.6

float hash(vec2 p){
	vec3 p3 = frac(CAST3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return frac((p3.x + p3.y) * p3.z);
}

float Grille(float x, float offset){
	return smoothstep(0.0, 1.0, sin(x * M_PI_2) + offset);
}

float ShadowMaskRows(vec2 uv){
    uv.x *= 0.5;
    uv.x -= floor(uv.x);
    if(uv.x < 0.0) uv.y += 0.5;
    
    return Grille(uv.y, -SHADOWMASK_HORIZGAPWIDTH);
}

float ShadowMaskColumns(vec2 uv){
    uv.y *= 0.5;
    uv.y -= floor(uv.y);
    if(uv.y < 0.0) uv.x += 0.5;
    
    return Grille(uv.x, -SHADOWMASK_HORIZGAPWIDTH);
}

vec3 ShadowMaskRGBCols(float x){
	return vec3(
        Grille(x + SHADOWMASK_RCOL_OFFSET, -SHADOWMASK_VERTGAPWIDTH), 
        Grille(x + SHADOWMASK_GCOL_OFFSET, -SHADOWMASK_VERTGAPWIDTH), 
        Grille(x + SHADOWMASK_BCOL_OFFSET, -SHADOWMASK_VERTGAPWIDTH)
    );
}

vec3 ShadowMask(vec2 uv){
#if SHADOWMASK == 4
    return ShadowMaskRGBCols(uv.x) * ShadowMaskRows(uv);
#endif
#if SHADOWMASK == 3
    return CAST3(ShadowMaskColumns(uv) * ShadowMaskRows(uv));
#endif
#if SHADOWMASK == 2
    return CAST3(ShadowMaskRows(uv));
#endif
#if SHADOWMASK == 1
    return CAST3(ShadowMaskColumns(uv));
#endif

}

void main() {
    vec4 baseAlbedo = texSample2D(g_Texture0, v_TexCoord);

    if (u_alpha > 0.0){
        vec4 albedo = texSample2D(g_Texture0, v_TexCoord);
        vec2 perspCoord = v_PerspCoord.xy / v_PerspCoord.z;
    
#if SHADOWMASK != 0
        albedo.rgb *= ShadowMask(perspCoord);
#endif

        albedo.rgb *= 1.0 - hash(round(perspCoord) + g_Time) * u_noise; //Static noise

        gl_FragColor = albedo;
    } else gl_FragColor = baseAlbedo;
}
