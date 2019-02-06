precision mediump float;
varying mediump vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec2 size;
uniform float intensity;
uniform float threshold;

float lm(vec4 px) {
  return (px.r + px.g + px.b) / 3.0;
}

float lm(vec2 pos) {
  return lm(texture2D(uSampler, pos));
}

float soften(float a, float b) {
  return abs(b - a) < threshold ? b : a;
}

void main(void) {
  vec4 color = texture2D(uSampler, vTextureCoord);

  float c22 = lm(color);

  float c11 = soften(lm(vTextureCoord - size), c22);
  float c12 = soften(lm(vec2(vTextureCoord.x, vTextureCoord.y - size.y)), c22);
  float c13 = soften(lm(vec2(vTextureCoord.x + size.x, vTextureCoord.y - size.y)), c22);
  float c21 = soften(lm(vec2(vTextureCoord.x - size.x, vTextureCoord.y)), c22);
  float c23 = soften(lm(vec2(vTextureCoord.x + size.x, vTextureCoord.y)), c22);
  float c31 = soften(lm(vec2(vTextureCoord.x - size.x, vTextureCoord.y + size.y)), c22);
  float c32 = soften(lm(vec2(vTextureCoord.x, vTextureCoord.y + size.y)), c22);
  float c33 = soften(lm(vTextureCoord + size), c22);

  gl_FragColor = color + color * intensity * (
    8.0 * c22 - c21 - c23 - c12 - c32 - c11 - c13 - c31 - c33
  );

  gl_FragColor.a = color.a;
}
