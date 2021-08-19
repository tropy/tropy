export const indexOf = (col, id) =>
  (col.idx != null) ?
    col.idx[id] :
    col.findIndex(it => it.id === id)
