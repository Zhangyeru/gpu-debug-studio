#version 460
#extension GL_EXT_samplerless_texture_functions : require

float _78;

layout(set = 1, binding = 1, std140) uniform type_View
{
    layout(offset = 192) mat4 View_TranslatedWorldToView;
    layout(offset = 704) mat4 View_SVPositionToTranslatedWorld;
    layout(offset = 1248) vec4 View_InvDeviceZToWorldZTransform;
} View;

layout(set = 1, binding = 0, std140) uniform type_Globals
{
    vec4 ScreenSpaceAOParams[5];
    vec4 ScreenPosToPrevSceneDepthTextureUV;
    vec2 SSAO_SvPositionScaleBias;
} _Globals;

layout(set = 1, binding = 2) uniform texture2D RandomNormalTexture;
layout(set = 1, binding = 4) uniform sampler RandomNormalTextureSampler;
layout(set = 1, binding = 3) uniform texture2D PrevSceneDepthTexture;
layout(set = 1, binding = 5) uniform sampler PrevSceneDepthSampler;

layout(location = 0) noperspective in vec4 in_var_TEXCOORD0;
layout(location = 0) out vec4 out_var_SV_Target0;

void main()
{
    vec3 _105 = vec3(_Globals.ScreenSpaceAOParams[3].w, _Globals.ScreenSpaceAOParams[1].w * _Globals.ScreenSpaceAOParams[3].w, 1.0);
    vec3 _106 = vec3(1.0) / _105;
    vec2 _112 = fma(gl_FragCoord.xy, _Globals.SSAO_SvPositionScaleBias.xx, _Globals.SSAO_SvPositionScaleBias.yy);
    float _113 = _112.x;
    vec4 _119 = texture(sampler2D(PrevSceneDepthTexture, PrevSceneDepthSampler), in_var_TEXCOORD0.xy);
    mediump float _21 = _119.x;
    float _129 = -View.View_InvDeviceZToWorldZTransform.w;
    float _132 = fma(_21, View.View_InvDeviceZToWorldZTransform.x, View.View_InvDeviceZToWorldZTransform.y) + (1.0 / fma(_21, View.View_InvDeviceZToWorldZTransform.z, _129));
    vec2 _133 = vec4(_113, _112.y, _78, _78).xy;
    uvec2 _134 = uvec2(_133);
    vec4 _141 = texelFetch(PrevSceneDepthTexture, ivec3(int(_134.x), int(_134.y), 0).xy, 0);
    float _142 = _141.x;
    uvec2 _144 = uvec2(_133 + vec2(-1.0, 0.0));
    uvec2 _154 = uvec2(_133 + vec2(0.0, -1.0));
    vec2 _163 = _133 + vec2(1.0, 0.0);
    uvec2 _164 = uvec2(_163);
    vec2 _173 = _133 + vec2(0.0, 1.0);
    uvec2 _174 = uvec2(_173);
    float _183 = _142 - texelFetch(PrevSceneDepthTexture, ivec3(int(_144.x), int(_144.y), 0).xy, 0).x;
    float _184 = texelFetch(PrevSceneDepthTexture, ivec3(int(_164.x), int(_164.y), 0).xy, 0).x - _142;
    float _189 = _142 - texelFetch(PrevSceneDepthTexture, ivec3(int(_154.x), int(_154.y), 0).xy, 0).x;
    float _190 = texelFetch(PrevSceneDepthTexture, ivec3(int(_174.x), int(_174.y), 0).xy, 0).x - _142;
    vec4 _198 = View.View_SVPositionToTranslatedWorld * vec4(_113, _112.y, _142, 1.0);
    vec3 _202 = _198.xyz / vec3(_198.w);
    vec4 _207 = View.View_SVPositionToTranslatedWorld * vec4(_163, _142 + ((abs(_183) < abs(_184)) ? _183 : _184), 1.0);
    vec4 _217 = View.View_SVPositionToTranslatedWorld * vec4(_173, _142 + ((abs(_189) < abs(_190)) ? _189 : _190), 1.0);
    vec3 _234 = normalize(mat3(View.View_TranslatedWorldToView[0].xyz, View.View_TranslatedWorldToView[1].xyz, View.View_TranslatedWorldToView[2].xyz) * cross((_207.xyz / vec3(_207.w)) - _202, (_217.xyz / vec3(_217.w)) - _202));
    vec3 _245 = vec3(in_var_TEXCOORD0.zw * _132, _132) + ((_234 * _105) * ((_Globals.ScreenSpaceAOParams[0].y * _132) * _Globals.ScreenSpaceAOParams[2].x));
    vec2 _253 = ((texture(sampler2D(RandomNormalTexture, RandomNormalTextureSampler), fma(in_var_TEXCOORD0.xy, _Globals.ScreenSpaceAOParams[1].xy, _Globals.ScreenSpaceAOParams[3].xy)).xy * 2.0) - vec2(1.0)) * (_Globals.ScreenSpaceAOParams[1].z * mix(_132, 1.0, _Globals.ScreenSpaceAOParams[2].z));
    float _255 = _245.z;
    float _260 = _253.x;
    vec4 _265 = vec4(_260, _253.y, -_253.y, _260) * vec4((_105.xy * (1.0 / _255)).xyxy);
    vec2 _268 = _245.xy / vec2(_255);
    vec3 _271 = _234 * (0.07999999821186065673828125 * mix(_132, 1000.0, _Globals.ScreenSpaceAOParams[2].z));
    vec2 _274 = (_265.zw * (-0.430000007152557373046875)) * 1.0;
    vec2 _275 = _268 + _274;
    vec2 _276 = _268 - _274;
    vec4 _284 = texture(sampler2D(PrevSceneDepthTexture, PrevSceneDepthSampler), fma(_275, _Globals.ScreenPosToPrevSceneDepthTextureUV.xy, _Globals.ScreenPosToPrevSceneDepthTextureUV.zw));
    mediump float _22 = _284.x;
    float _288 = fma(_22, View.View_InvDeviceZToWorldZTransform.x, View.View_InvDeviceZToWorldZTransform.y) + (1.0 / fma(_22, View.View_InvDeviceZToWorldZTransform.z, _129));
    vec4 _290 = texture(sampler2D(PrevSceneDepthTexture, PrevSceneDepthSampler), fma(_276, _Globals.ScreenPosToPrevSceneDepthTextureUV.xy, _Globals.ScreenPosToPrevSceneDepthTextureUV.zw));
    mediump float _23 = _290.x;
    float _294 = fma(_23, View.View_InvDeviceZToWorldZTransform.x, View.View_InvDeviceZToWorldZTransform.y) + (1.0 / fma(_23, View.View_InvDeviceZToWorldZTransform.z, _129));
    vec3 _304 = (vec3(_275 * _288, _288) - _245) * _106;
    vec3 _306 = (vec3(_276 * _294, _294) - _245) * _106;
    vec2 _316 = vec3(clamp(dot(_304, _271) / dot(_304, _304), 0.0, 1.0), clamp(dot(_306, _271) / dot(_306, _306), 0.0, 1.0), 1.0).xy;
    vec2 _317 = mix(mix(max(vec2(0.0), _316), _316, isnan(vec2(0.0))), vec2(0.0), isnan(_316));
    float _320 = 1.0 - _317.x;
    float _324 = 1.0 - _317.y;
    vec2 _332 = ((_265.xy * 0.4059999883174896240234375) + (_265.zw * 0.56980001926422119140625)) * 1.0;
    vec2 _333 = _268 + _332;
    vec2 _334 = _268 - _332;
    vec4 _338 = texture(sampler2D(PrevSceneDepthTexture, PrevSceneDepthSampler), fma(_333, _Globals.ScreenPosToPrevSceneDepthTextureUV.xy, _Globals.ScreenPosToPrevSceneDepthTextureUV.zw));
    float _339 = _338.x;
    float _343 = fma(_339, View.View_InvDeviceZToWorldZTransform.x, View.View_InvDeviceZToWorldZTransform.y) + (1.0 / fma(_339, View.View_InvDeviceZToWorldZTransform.z, _129));
    vec4 _345 = texture(sampler2D(PrevSceneDepthTexture, PrevSceneDepthSampler), fma(_334, _Globals.ScreenPosToPrevSceneDepthTextureUV.xy, _Globals.ScreenPosToPrevSceneDepthTextureUV.zw));
    float _346 = _345.x;
    float _350 = fma(_346, View.View_InvDeviceZToWorldZTransform.x, View.View_InvDeviceZToWorldZTransform.y) + (1.0 / fma(_346, View.View_InvDeviceZToWorldZTransform.z, _129));
    vec3 _360 = (vec3(_333 * _343, _343) - _245) * _106;
    vec3 _362 = (vec3(_334 * _350, _350) - _245) * _106;
    vec2 _372 = vec3(clamp(dot(_360, _271) / dot(_360, _360), 0.0, 1.0), clamp(dot(_362, _271) / dot(_362, _362), 0.0, 1.0), 1.0).xy;
    vec2 _373 = mix(mix(max(vec2(0.0), _372), _372, isnan(vec2(0.0))), vec2(0.0), isnan(_372));
    float _376 = 1.0 - _373.x;
    float _380 = 1.0 - _373.y;
    vec2 _387 = ((_265.xy * (-0.579999983310699462890625)) + (_265.zw * 0.81400001049041748046875)) * 1.0;
    vec2 _388 = _268 + _387;
    vec2 _389 = _268 - _387;
    vec4 _393 = texture(sampler2D(PrevSceneDepthTexture, PrevSceneDepthSampler), fma(_388, _Globals.ScreenPosToPrevSceneDepthTextureUV.xy, _Globals.ScreenPosToPrevSceneDepthTextureUV.zw));
    float _394 = _393.x;
    float _398 = fma(_394, View.View_InvDeviceZToWorldZTransform.x, View.View_InvDeviceZToWorldZTransform.y) + (1.0 / fma(_394, View.View_InvDeviceZToWorldZTransform.z, _129));
    vec4 _400 = texture(sampler2D(PrevSceneDepthTexture, PrevSceneDepthSampler), fma(_389, _Globals.ScreenPosToPrevSceneDepthTextureUV.xy, _Globals.ScreenPosToPrevSceneDepthTextureUV.zw));
    float _401 = _400.x;
    float _405 = fma(_401, View.View_InvDeviceZToWorldZTransform.x, View.View_InvDeviceZToWorldZTransform.y) + (1.0 / fma(_401, View.View_InvDeviceZToWorldZTransform.z, _129));
    vec3 _415 = (vec3(_388 * _398, _398) - _245) * _106;
    vec3 _417 = (vec3(_389 * _405, _405) - _245) * _106;
    vec2 _427 = vec3(clamp(dot(_415, _271) / dot(_415, _415), 0.0, 1.0), clamp(dot(_417, _271) / dot(_417, _417), 0.0, 1.0), 1.0).xy;
    vec2 _428 = mix(mix(max(vec2(0.0), _427), _427, isnan(vec2(0.0))), vec2(0.0), isnan(_427));
    float _431 = 1.0 - _428.x;
    float _435 = 1.0 - _428.y;
    vec2 _438 = (((((vec2(9.9999997473787516355514526367188e-05) + vec2(_320 * _320, 1.0)) + vec2(_324 * _324, 1.0)) + vec2(_376 * _376, 1.0)) + vec2(_380 * _380, 1.0)) + vec2(_431 * _431, 1.0)) + vec2(_435 * _435, 1.0);
    out_var_SV_Target0 = vec4(fma(pow(abs(mix(_438.x / _438.y, 1.0, clamp(fma(_132, _Globals.ScreenSpaceAOParams[4].x, _Globals.ScreenSpaceAOParams[4].y), 0.0, 1.0))), _Globals.ScreenSpaceAOParams[0].x) - 1.0, _Globals.ScreenSpaceAOParams[0].w, 1.0));
}