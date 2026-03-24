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
  let columns = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === separator && !inQuotes) {
      columns.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  columns.push(current)
  return columns.filter(column => column.length > 0)
}
