#define WEMOBILE_DISABLE_INTEGER_CONVERSION

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform float g_AudioSpectrum64Left[64];
uniform float g_AudioSpectrum64Right[64];

uniform float barCount; // {"material":"Bar Count","int":true,"default":0,"range":[0,100]}
uniform float barWidth; // {"material":"Bar Width","int":false,"default":0,"range":[0,1]}
uniform float barPos; // {"material":"Bar Offset","int":true,"default":0,"range":[0,2]}

uniform vec3 c; // {"default":"1 1 1","material":"Color","type":"color"}

uniform vec2 pos1; // {"default":"0.5 0.5","linked":true,"material":"Position 1","range":[0,1]}
uniform vec2 pos2; // {"default":"0.5 0.5","linked":true,"material":"Position 2","range":[0,1]}

uniform float samples; // {"material":"Samples","int":true,"default":64,"range":[0,64]}

uniform float interpolateStrength; // {"material":"Interpolation","int":false,"default":2,"range":[0,8]}

uniform vec2 scale; // {"default":"1.0 0.2","linked":true,"material":"Scale","range":[0,2]}

uniform float aa; // {"material":"Antialiasing","int":false,"default":0.01,"range":[0,1]}


varying vec2 v_TexCoord;

float isLeft(vec2 p, vec2 l1, vec2 l2){
	 return sign((l2.x - l1.x)*(p.y - l1.y) - (l2.y - l1.y)*(p.x - l1.x));
}

vec2 lineCoordinates(vec2 p, vec2 a, vec2 b)
{
	float x = dot(p-a, b-a)/length(b-a)/length(b-a);
	float y = distance(p, mix(a, b, x));
	return vec2(x, y);
}

float ease(float x, float k)
{
	x = 2.*x - 1;
	return 0.5*sign(x)*(1. - pow(1. - abs(x), k)) + 0.5;
}

float getAverageAudio(float i, float d, float k)
{
	if(i > 64. || i < 0.)
		return 0.;
	float n = floor(i/d)*d;
	float a = mix(g_AudioSpectrum64Left[(int) n], g_AudioSpectrum64Left[(int) (n + d)], ease((i/d) % 1., k));
	float b = mix(g_AudioSpectrum64Right[(int) n], g_AudioSpectrum64Right[(int) (n + d)], ease((i/d) % 1., k));
	return a*0.5 + b*0.5;
}

void main()
{
	vec2 coord = lineCoordinates(v_TexCoord.xy, pos1, pos2);
	float rc = floor(coord.x*barCount)/barCount;
	float height = getAverageAudio(rc*32.*scale.x, 64./samples, interpolateStrength)*scale.y;
	float b = smoothstep(aa*0.1, 0., coord.y - height);
	b = min(b, smoothstep(0., aa*barCount*0.1, barWidth - abs(abs(rc - coord.x) * barCount - 0.5) / 0.5));
	if(barPos != 1.)
	{
		b *= max(0., isLeft(v_TexCoord.xy, pos1, pos2)*(1.-barPos));
	}
	vec4 oc = texSample2D(g_Texture0, v_TexCoord.xy);
	gl_FragColor.rgb = mix(oc.rgb, c.rgb, CAST3(b));
	gl_FragColor.a = oc.a;
}