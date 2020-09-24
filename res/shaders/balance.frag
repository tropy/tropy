precision mediump float;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float a;
uniform float b;
uniform float c;

const float PI = 3.1415926535897932384626433832795;

vec3 rgb2xyz(vec3 c) {
	vec3 tmp = vec3(
		(c.r > .04045) ? pow((c.r + .055) / 1.055, 2.4) : c.r / 12.92,
		(c.g > .04045) ? pow((c.g + .055) / 1.055, 2.4) : c.g / 12.92,
		(c.b > .04045) ? pow((c.b + .055) / 1.055, 2.4) : c.b / 12.92);

	mat3 mat = mat3(
		.4124, .3576, .1805,
		.2126, .7152, .0722,
		.0193, .1192, .9505);

	return 100. * (tmp * mat);
}

vec3 xyz2lab(vec3 c) {
	vec3 n = c / vec3(95.047, 100., 108.883),
	     v = vec3(
    (n.x > .008856) ? pow(n.x, 1./3.) : (7.787 * n.x) + (16./116.),
    (n.y > .008856) ? pow(n.y, 1./3.) : (7.787 * n.y) + (16./116.),
    (n.z > .008856) ? pow(n.z, 1./3.) : (7.787 * n.z) + (16./116.));

	return vec3(
    (v.y * 116.) - 16.,
    (v.x - v.y) * 500.,
    (v.y - v.z) * 200.);
}

vec3 rgb2lab(vec3 c) {
	vec3 lab = xyz2lab(rgb2xyz(c));

	return vec3(
    lab.x / 100.,
    .5 + .5 * (lab.y / 127.),
    .5 + .5 * (lab.z / 127.));
}

vec3 lab2xyz(vec3 c) {
	float fy = (c.x+16.)/116.,
	      fx = c.y / 500. + fy,
	      fz = fy-c.z/200.;

	return vec3(
		 95.047 * ((fx > .206897) ? fx * fx * fx : (fx - 16./116.) / 7.787),
		100.    * ((fy > .206897) ? fy * fy * fy : (fy - 16./116.) / 7.787),
		108.883 * ((fz > .206897) ? fz * fz * fz : (fz - 16./116.) / 7.787)
	);
}

vec3 xyz2rgb(vec3 c) {
	mat3 mat = mat3(
		 3.2406, -1.5372, -0.4986,
		-0.9689,  1.8758,  0.0415,
		 0.0557, -0.2040,  1.0570);

	vec3 v = (c / 100.) * mat;

	return vec3(
		(v.r > .0031308) ? ((1.055 * pow(v.r, (1./2.4))) - .055) : 12.92 * v.r,
		(v.g > .0031308) ? ((1.055 * pow(v.g, (1./2.4))) - .055) : 12.92 * v.g,
		(v.b > .0031308) ? ((1.055 * pow(v.b, (1./2.4))) - .055) : 12.92 * v.b);
}

vec3 lab2rgb(vec3 c) {
  return xyz2rgb(lab2xyz(vec3(
    100. * c.x,
    2. * 127. * (c.y - .5),
    2. * 127. * (c.z - .5))));
}

void main(void) {
  vec4 pix = texture2D(uSampler, vTextureCoord);
  vec3 rgb = vec3(pix.r, pix.g, pix.b);

  if (a != 0. || b != 0.) {
    vec3 lab = rgb2lab(rgb);
    float gamma = sin(lab.x * PI);

    rgb = lab2rgb(
      vec3(
        lab.x + c * .9 * gamma,
        lab.y + (a + .016) * gamma,
        lab.z + (b - .016) * gamma
      )
    );
  }

  gl_FragColor = vec4(rgb, pix.a);
}
