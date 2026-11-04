#version 300 es
precision highp float;

in vec2 vLocal;
out vec4 finalColor;

uniform sampler2D uTexture;

// Maps corrected (local) pixels to normalized texture coordinates.
uniform mat3 uInverse;

// The texture size in pixels.
uniform vec2 uSize;

void main(void) {
  vec3 p = uInverse * vec3(vLocal, 1.0);

  if (p.z <= 0.0)
    discard;

  vec2 uv = p.xy / p.z;
  vec2 px = uv * uSize;

  // Anti-alias the edges: fade out over one screen pixel, using
  // the distance to the nearest edge in texture pixels and its
  // rate of change per screen pixel.
  vec2 d = min(px, uSize - px) / fwidth(px);
  float coverage = clamp(min(d.x, d.y) + 0.5, 0.0, 1.0);

  if (coverage <= 0.0)
    discard;

  // Premultiplied alpha
  finalColor = texture(uTexture, clamp(uv, 0.0, 1.0)) * coverage;
}
