export const indexOf = (col, id) =>
  (col.idx != null) ?
    col.idx[id] :
    col.findIndex(it => it.id === id)

export const sanitize = (col, index, restrict = 'bounds') => {
  if (index >= 0 && index < col.length)
    return index

  switch (restrict) {
    case 'wrap':
      index = index % col.length
      return (index < 0) ? index + col.length : index

    case 'bounds':
      return (index < 0) ? 0 : col.length - 1

    default:
      return null
  }
}
