// Aproximates filters in CSS
export function cssFilter ({
  brightness,
  contrast,
  saturation,
  hue,
  negative
}) {
  let filter = []

  if (brightness) filter.push(`brightness(${1 + brightness / 100})`)
  if (contrast) filter.push(`contrast(${1 + contrast / 100})`)
  if (saturation) filter.push(`saturate(${1 + saturation / 100})`)
  if (hue) filter.push(`hue-rotate(${hue}deg)`)
  if (negative) filter.push('invert(1)')

  return filter.join(' ') || undefined
}
