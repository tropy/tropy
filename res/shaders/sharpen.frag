precision mediump float;
varying mediump vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec2 size;
uniform float intensity;

float lm(vec4 px) {
  return (px.r + px.g + px.b) / 3.0;
}

float lm(vec2 pos) {
  return lm(texture2D(uSampler, pos));
}

void main(void) {
  vec4 color = texture2D(uSampler, vTextureCoord);

  float c22 = lm(color);

  float c11 = lm(vTextureCoord - size);
  float c12 = lm(vec2(vTextureCoord.x, vTextureCoord.y - size.y));
  float c13 = lm(vec2(vTextureCoord.x + size.x, vTextureCoord.y - size.y));
  float c21 = lm(vec2(vTextureCoord.x - size.x, vTextureCoord.y));
  float c23 = lm(vec2(vTextureCoord.x + size.x, vTextureCoord.y));
  float c31 = lm(vec2(vTextureCoord.x - size.x, vTextureCoord.y + size.y));
  float c32 = lm(vec2(vTextureCoord.x, vTextureCoord.y + size.y));
  float c33 = lm(vTextureCoord + size);

  gl_FragColor = color + color * intensity * (
    8.0 * c22 - c21 - c23 - c12 - c32 - c11 - c13 - c31 - c33
  );

  gl_FragColor.a = color.a;
}
