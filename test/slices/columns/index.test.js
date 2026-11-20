import reducer, {
  insert,
  order,
  remove,
  resize,
  restore,
  selectColumnOptions
} from '#tropy/slices/columns/index.js'
import { dc, tropy } from '#tropy/ontology/ns.js'

describe('columns', () => {
  let state = [
    { id: 'a', width: 10 },
    { id: 'b', width: 20 }
  ]

  it('restores valid columns, else the defaults', () => {
    expect(reducer(undefined, restore(state))).to.eql(state)
    expect(reducer(undefined, restore([{ id: 'a' }]))).to.eql(reducer(undefined, {}))
    expect(reducer(undefined, restore(null))).to.eql(reducer(undefined, {}))
  })

  it('inserts, removes, orders and resizes columns', () => {
    let c = { id: 'c', width: 30 }

    expect(reducer(state, insert(c, { idx: 1 }))).to.eql([state[0], c, state[1]])
    expect(reducer(state, remove({ id: 'a' }))).to.eql([state[1]])
    expect(reducer(state, order({ order: { a: 1, b: 0 } })))
      .to.eql([state[1], state[0]])
    expect(reducer(state, resize({ column: 1, width: 50 }))[1])
      .to.eql({ id: 'b', width: 50 })
  })

  it('offers the shown columns first, then the others once', () => {
    let state = {
      columns: [{ id: dc.title, width: 10 }, { id: 'item.created', width: 10 }],
      intl: { messages: {} },
      ontology: {
        vocab: {},
        props: { [dc.title]: { id: dc.title }, [dc.date]: { id: dc.date } },
        template: {
          t: { id: 't', type: tropy.Item, fields: [{ property: dc.title }] }
        }
      }
    }

    let ids = (opt) => selectColumnOptions(state, opt).map(col => col.id)

    expect(ids('common')).to.eql([
      dc.title, 'item.created', 'item.modified', 'item.template'
    ])
    expect(ids('all')).to.eql([
      dc.title, 'item.created', 'item.modified', 'item.template', dc.date
    ])
  })
})
