// [COMBO] {"material":"Shadow mask","combo":"SHADOWMASK","type":"options","default":1,"options":{"None":0,"Vertical stripes":1,"Horizontal stripes":2,"Grid":3,"RGB":4}}
// [COMBO] {"material":"Frequency artifacts","combo":"ARTIFACTS","type":"options","default":1}
// [COMBO] {"material":"Write alpha","combo":"WALPHA","type":"options","default":0}
// [COMBO] {"material":"Perspective","combo":"PERSPECTIVE","type":"options","default":0}
// [COMBO] {"material":"Black borders","combo":"BLACKBORDERS","type":"options","default":1}

#include "common.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"hidden":true}
uniform sampler2D g_Texture2; // {"combo":"MASK","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform float u_frequency; // {"material":"Frequency","default":10,"range":[0,30],"group":"Screen"}
uniform float u_strength1; // {"material":"scan line strength","label":"Strength","default":0.2,"range":[0,1],"group":"Scan line"}
uniform float u_amount1; // {"material":"Scan line count","label":"Count","default":1.0,"range":[0,3],"group":"Scan line"}
uniform float u_size1; // {"material":"Size","default":1.0,"range":[0,2],"group":"Scan line"}
uniform float u_strength2; // {"material":"flicker strength","label":"Strength","default":0.3,"range":[0,1],"group":"Flicker"}
uniform float u_amount2; // {"material":"flicker amount","label":"Amount","default":0.5,"range":[0,1],"group":"Flicker"}
uniform float u_offset2; // {"material":"flicker offset","label":"Offset","default":0,"range":[0,1],"group":"Flicker"}
uniform float u_brightness; // {"material":"Brightness","default":1,"range":[0,3],"group":"Color"}
uniform float u_saturation; // {"material":"Saturation","default":0.75,"range":[0,1],"group":"Color"}
uniform float u_curvature; // {"material":"Curvature","default":0.6,"range":[0,2],"group":"Screen"}
uniform float u_resolution; // {"material":"Resolution","default":0.5,"range":[0,2],"group":"Screen"}
uniform float u_bloom; // {"material":"Light bleed","default":2.2,"range":[1,4],"group":"Imperfections"}
uniform float u_alpha; // {"material":"Opacity","default":1,"range":[0,1]}
uniform vec2 u_borders; // {"default":"0.5 0.5","group":"Screen","linked":true,"material":"Border size","range":[0,1]}

uniform float g_Time;
varying vec2 v_TexCoord;
varying vec3 v_PerspCoord;

vec3 saturation(vec3 color) {
    vec3 weights_ = vec3(0.2126, 0.7152, 0.0722);
    float luminance_ = dot(color, weights_);
    color = mix(CAST3(luminance_), color, CAST3(u_saturation));
    return color;
}

vec3 bloom(vec3 color, vec2 uv){
    color = pow(color, CAST3(u_bloom));
    vec2 right = vec2(0.002, 0.0);
    vec2 up = vec2(0.0, 0.002);

    vec3 colorT = texSample2D(g_Texture0, uv + up).rgb;
    vec3 colorB = texSample2D(g_Texture0, uv - up).rgb;
    vec3 colorL = texSample2D(g_Texture0, uv - right).rgb;
    vec3 colorR = texSample2D(g_Texture0, uv + right).rgb;

    color = color + (colorT + colorB + colorL + colorR) * 0.05;
    return pow(color, CAST3(1.0 / u_bloom));
}

void main() {
    vec4 baseAlbedo = texSample2D(g_Texture1, v_TexCoord);

#if MASK
    float mask = texSample2D(g_Texture2, v_TexCoord).r;
#else
#define mask 1.0;
#endif

    float opacity = u_alpha * mask;
#if !WALPHA
    opacity *= baseAlbedo.a;
#endif

    if (opacity > 0.001){
        //Curvature
        vec2 perspCoord = v_PerspCoord.xy / v_PerspCoord.z - 0.5;
        vec2 perspUV = perspCoord * u_borders;
        float z = sqrt(0.5 - perspUV.x * perspUV.x * u_curvature - perspUV.y * perspUV.y * u_curvature);
        vec2 uv = perspUV / max(0.0001, z * 0.707);

        vec2 uvImage = (v_TexCoord - 0.5) / max(0.0001, z * (1.414 * (1.0 + u_curvature * 0.1))) + 0.5;
        
        vec4 albedo = CAST4(1.0);
        albedo.rgb = bloom(texSample2D(g_Texture0, uvImage).rgb, uvImage); //Light bleed
        albedo.rgb *= 1.0 - length(perspCoord) * 1.0; //Vignette

        vec4 image = albedo;
        albedo.rgb = saturation(albedo.rgb);
        albedo.rgb *= (u_brightness + u_brightness);
#if SHADOWMASK == 4
        albedo.rgb *= 2.2;
#endif
    
#if ARTIFACTS
        float speed = g_Time * u_frequency;
        albedo.rgb *= 1.0 - min(1.0, mod(1.0 - uv.y * u_amount1 + speed, 1.0) * u_size1) * u_strength1; //Scan line
        albedo.rgb *= 1.0 - abs(mod(1.0 - (uv.y + u_offset2) * u_amount2 + speed, 2.0) - 1.0) * u_strength2; //Flicker
#endif

        albedo *= smoothstep(0.51, 0.50, max(abs(uv.x), abs(uv.y))); //Borders
#if BLACKBORDERS
#define borders step(max(abs(perspCoord.x), abs(perspCoord.y)), 0.5)
#else
#define borders albedo.a
#endif

        albedo.rgb = mix(baseAlbedo.rgb, albedo.rgb, borders * opacity);
#if WALPHA
        albedo.a = max(borders, baseAlbedo.a);
#else
        albedo.a = baseAlbedo.a;
#endif
        gl_FragColor = albedo;
    } else gl_FragColor = baseAlbedo;
}