import { mkprojtmp } from '../support/project.js'
import list from '#tropy/models/list.js'
import { LIST } from '#tropy/constants/index.js'

describe('models/list', () => {
  let tpy = mkprojtmp('list.tpy', { name: 'Lists' })

  it('orders child lists', async () => {
    let db = tpy.current.db
    let a = (await list.create(db, { name: 'a', parent: LIST.ROOT })).id
    let b = (await list.create(db, { name: 'b', parent: LIST.ROOT })).id
    let c = (await list.create(db, { name: 'c', parent: LIST.ROOT })).id

    await list.order(db, LIST.ROOT, [c, a, b])
    expect((await list.all(db))[LIST.ROOT].children).to.eql([c, a, b])
  })
})
