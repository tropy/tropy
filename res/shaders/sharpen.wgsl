struct SharpenUniforms {
  size:vec2<f32>,
  intensity:f32,
};

struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

@group(0) @binding(1) var uTexture: texture_2d<f32>; 
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> sharpenUniforms : SharpenUniforms;

@fragment
fn mainFragment(
  @builtin(position) position: vec4<f32>,
  @location(0) uv : vec2<f32>
) -> @location(0) vec4<f32> {
  let color: vec4<f32> = textureSample(uTexture, uSampler, uv);

	let c22: f32 = lm(color);

	let c11: f32 = lm2(uv - sharpenUniforms.size);
	let c12: f32 = lm2(vec2<f32>(uv.x, uv.y - sharpenUniforms.size.y));
	let c13: f32 = lm2(vec2<f32>(uv.x + sharpenUniforms.size.x, uv.y - sharpenUniforms.size.y));
	let c21: f32 = lm2(vec2<f32>(uv.x - sharpenUniforms.size.x, uv.y));
	let c23: f32 = lm2(vec2<f32>(uv.x + sharpenUniforms.size.x, uv.y));
	let c31: f32 = lm2(vec2<f32>(uv.x - sharpenUniforms.size.x, uv.y + sharpenUniforms.size.y));
	let c32: f32 = lm2(vec2<f32>(uv.x, uv.y + sharpenUniforms.size.y));
	let c33: f32 = lm2(uv + sharpenUniforms.size);

	var finalColor: vec4<f32> = color + color * sharpenUniforms.intensity * (
    8. * c22 - c21 - c23 - c12 - c32 - c11 - c13 - c31 - c33
  );

	finalColor.a = color.a;
  return finalColor;
}

fn lm(px: vec4<f32>) -> f32 {
	return (px.r + px.g + px.b) / 3.;
} 

fn lm2(pos: vec2<f32>) -> f32 {
  return lm(textureSample(uTexture, uSampler, pos));
} 
