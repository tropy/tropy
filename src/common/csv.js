export function encode(value, quote = /"/g) {
  return `"${String(value).replace(quote, m => m + m)}"`
}

export function decode(value) {
  return value.replace(/^"|"$/g, '').replace(/""/g, '"')
}

export function join(values, separator = ',') {
  return values
    .map(value => encode(value))
    .join(separator)
}

export function parse(text, separator = ',') {
  return text
    .split(separator)
    .filter(column => column.length > 0)
    .map(decode)
}
