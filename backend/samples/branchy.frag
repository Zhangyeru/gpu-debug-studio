#version 450

layout(location = 0) in vec2 uv;
layout(location = 0) out vec4 outColor;
layout(binding = 0) uniform sampler2D tex0;

void main() {
  vec4 color = vec4(0.0);
  if (uv.x > 0.5) {
    color += texture(tex0, uv);
  } else {
    color += texture(tex0, uv * 0.5);
  }
  if (uv.y > 0.25) {
    color.rgb = normalize(color.rgb);
  }
  outColor = color;
}
