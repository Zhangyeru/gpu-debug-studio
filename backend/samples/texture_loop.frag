#version 450

layout(location = 0) in vec2 uv;
layout(location = 0) out vec4 outColor;
layout(binding = 0) uniform sampler2D tex0;

void main() {
  vec4 sum = vec4(0.0);
  for (int i = 0; i < 4; ++i) {
    vec2 offset = uv + vec2(float(i) * 0.01);
    sum += normalize(texture(tex0, offset));
  }
  outColor = sum;
}
