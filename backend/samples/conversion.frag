#version 450

layout(location = 0) in vec2 uv;
layout(location = 0) out vec4 outColor;
layout(binding = 0) uniform sampler2D tex0;

void main() {
  vec4 color = texture(tex0, uv);
  int channel = int(color.r * 255.0);
  float restored = float(channel) / 255.0;
  outColor = vec4(restored, float(int(color.g * 255.0)) / 255.0, color.b, 1.0);
}
