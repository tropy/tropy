#version 300 es

in vec2 aPosition;
out vec2 vLocal;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main(void) {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

  // The container's transform is affine, so the local position
  // interpolates exactly; the perspective divide happens per pixel.
  vLocal = aPosition;
}
