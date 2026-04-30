#version 450

layout(location = 0) in vec2 uv;
layout(location = 0) out vec4 outColor;
layout(binding = 0) uniform sampler2D tex0;

const float KERNEL_RADIUS = 2.0;
const float PI = 3.14159265;

float gaussian(float x, float sigma) {
  return exp(-0.5 * (x * x) / (sigma * sigma)) / (sqrt(2.0 * PI) * sigma);
}

void main() {
  vec4 accum = vec4(0.0);
  float weightSum = 0.0;
  float sigma = 1.0;

  for (int x = -2; x <= 2; ++x) {
    float wx = gaussian(float(x), sigma);
    for (int y = -2; y <= 2; ++y) {
      float wy = gaussian(float(y), sigma);
      float w = wx * wy;
      vec2 sampleUV = uv + vec2(float(x), float(y)) / vec2(512.0, 512.0);
      accum += texture(tex0, sampleUV) * w;
      weightSum += w;
    }
  }

  outColor = accum / weightSum;
}
