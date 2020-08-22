function sort(locale = ARGS.locale) {
  if (!(locale in sort)) {
    sort[locale] = new Intl.Collator(locale, {
      numeric: true
    })
  }

  return sort[locale]
}

function search(locale = ARGS.locale) {
  if (!(locale in search)) {
    search[locale] = new Intl.Collator(locale, {
      numeric: true,
      usage: 'search',
      sensitivity: 'base'
    })
  }

  return search[locale]
}

export function match(string, term, at = /^\p{Alpha}/gmu) {
  let cmp = search().compare
  let m

  while ((m = at.exec(string)) != null) {
    if (0 === cmp(string.slice(m.index, m.index + term.length), term)) {
      return [m.index, m.index + term.length]
    }
  }

  return null
}

export function compare(a, b) {
  return sort().compare(a, b)
}

export function by(...keys) {
  return (a, b, cmp = sort().compare) => {
    for (let key of keys) {
      let res = cmp(a[key], b[key])
      if (0 !== res) return res
    }
    return 0
  }
}

export function equals(a, b) {
  return 0 === search().compare(a, b)
}

export function startsWith(...args) {
  return match(...args) != null
}
