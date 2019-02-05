  precision mediump float;
  varying mediump vec2 vTextureCoord;

  uniform sampler2D uSampler;
  uniform vec2 size;
  uniform float intensity;

  float gray(vec4 n) {
    return (n.r + n.g + n.b)/3.0;
  }

  void main(void) {
    float c11 = gray(texture2D(uSampler, vTextureCoord - size));
    float c12 = gray(texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y - size.y)));
    float c13 = gray(texture2D(uSampler, vec2(vTextureCoord.x + size.x, vTextureCoord.y - size.y)));

    float c21 = gray(texture2D(uSampler, vec2(vTextureCoord.x - size.x, vTextureCoord.y)));
    vec4 c22 = texture2D(uSampler, vTextureCoord);
    float c23 = gray(texture2D(uSampler, vec2(vTextureCoord.x + size.x, vTextureCoord.y)));

    float c31 = gray(texture2D(uSampler, vec2(vTextureCoord.x - size.x, vTextureCoord.y + size.y)));
    float c32 = gray(texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y + size.y)));
    float c33 = gray(texture2D(uSampler, vTextureCoord + size));

    gl_FragColor = c22 + c22 * intensity * (
      8.0 * gray(c22) - c21 - c23 - c12 - c32 - c11 - c13 - c31 - c33
    );

    gl_FragColor.a = c22.a;
  }
