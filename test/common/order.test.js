import { build, presort, update } from '#tropy/common/order.js'

describe('order', () => {
  let { compare } = new Intl.Collator('en', { numeric: true })
  let keys = {
    1: 'b', 2: '10', 3: null, 4: 'A', 5: '2', 6: '', 7: 'a', 8: 'b'
  }
  let key = id => keys[id]

  describe('build', () => {
    it('sorts naturally, empty keys last, equal keys by id', () => {
      expect(build(Object.keys(keys).map(Number), key, { compare }))
        .to.eql([5, 2, 7, 4, 1, 8, 3, 6])
    })

    it('keeps empty keys last in descending order', () => {
      expect(build(Object.keys(keys).map(Number), key, { compare, asc: false }))
        .to.eql([8, 1, 4, 7, 2, 5, 6, 3])
    })

    it('does not depend on the input order', () => {
      let ids = Object.keys(keys).map(Number)
      expect(build(presort(ids, key), key, { compare }))
        .to.eql(build(ids.reverse(), key, { compare }))
    })

    it('sorts NaN keys as empty', () => {
      let dates = { 1: 2020, 2: NaN, 3: 2019, 4: 2021 }
      expect(build([1, 2, 3, 4], id => dates[id])).to.eql([3, 1, 4, 2])
    })
  })

  describe('update', () => {
    // A small deterministic PRNG, so failures can be reproduced.
    let random = (seed => () =>
      (seed = (seed * 16807) % 2147483647) / 2147483647)(42)

    let pick = (list) => list[Math.floor(random() * list.length)]
    let words = ['a', 'B', 'b', 'é', 'e', '1', '2', '10', 'x 2', 'x 10', '', null, NaN]

    for (let asc of [true, false]) {
      it(`matches a full build after random edits (asc: ${asc})`, () => {
        let options = { compare, asc }
        let data = {}
        let next = 1

        for (; next <= 50; ++next) data[next] = pick(words)

        let k = id => data[id]
        let seq = build(Object.keys(data).map(Number), k, options)

        for (let step = 0; step < 200; ++step) {
          let changed = []
          let removed = []

          for (let i = Math.floor(random() * 4); i > 0; --i) {
            let r = random()
            let ids = Object.keys(data).map(Number)

            if (r < 0.6 && ids.length > 0) {
              let id = pick(ids)
              data[id] = pick(words)
              changed.push(id)
            } else if (r < 0.8 || ids.length === 0) {
              data[next] = pick(words)
              changed.push(next++)
            } else {
              let id = pick(ids)
              delete data[id]
              removed.push(id)
            }
          }

          seq = update(seq, { changed, removed }, k, options)

          expect(seq).to.eql(build(Object.keys(data).map(Number), k, options))
        }
      })
    }
  })
})
