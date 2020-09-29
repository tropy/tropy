import { blank } from '../common/util'

const strip = (id, vocab) =>
  blank(vocab) ?
    id.split(/(#|\/)/).pop() :
    id.slice(vocab.length)

export const expand = (res, vocab) => ({
  ...res,
  name: strip(res.id, res.vocabulary),
  prefix: vocab?.[res.vocabulary]?.prefix
})
