export const indexOf = (col, id) =>
  (col.idx != null) ?
    col.idx[id] ?? -1 :
    col.findIndex(it => it.id === id)

export const sanitize = (len, index, restrict = 'bounds') => {
  if (index >= 0 && index < len)
    return index

  switch (restrict) {
    case 'wrap':
      index = index % len
      return (index < 0) ? index + len : index

    case 'bounds':
      return (index < 0) ? 0 : len - 1

    default:
      return null
  }
}
