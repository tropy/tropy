export function encode(value, quote = /"/g) {
  return `"${String(value).replace(quote, m => m + m)}"`
}

export function join(values, comma = ',') {
  return values
    .map(value => encode(value))
    .join(comma)
}
