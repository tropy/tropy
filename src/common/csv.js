'use strict'

function encode(value, quote = /"/g) {
  return `"${String(value).replace(quote, m => m + m)}"`
}

function join(values, comma = ',') {
  return values
    .map(value => encode(value))
    .join(comma)
}

module.exports = {
  encode,
  join
}
