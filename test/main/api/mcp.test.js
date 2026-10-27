import { mkapi } from '../../support/api.js'
import { TAG } from '#tropy/constants/index.js'

describe('api /mcp', () => {
  let api = mkapi()

  let call = (name, args) =>
    api.rpc('tools/call', { name, arguments: args })

  it('lists a tool per route with a flat input', async () => {
    let { tools } = await api.rpc('tools/list', {})
    let tool = (name) => tools.find(t => t.name === name)

    expect(tools.map(t => t.name)).to.include.members([
      'status', 'projects.list', 'items.find', 'tags.create', 'open'
    ])
    expect(tools.map(t => t.name)).not.to.include('photos.original')

    expect(tool('tags.create').inputSchema).to.deep.include({
      required: ['urlId', 'name'],
      additionalProperties: false
    })
    expect(tool('tags.create').inputSchema.properties)
      .to.include.keys('urlId', 'name', 'color', 'items')

    expect(tool('metadata.save').inputSchema.required)
      .to.eql(['urlId', 'id', 'body'])
    expect(tool('notes.show').inputSchema.properties).to.include.key('accept')
    expect(tool('open').description).to.include('tropy://project')
  })

  it('runs tools as HTTP requests', async () => {
    api.respond([1, 2])
    expect(await call('tags.create', { urlId: 'foo', name: 'Foo', items: [7] }))
      .to.deep.include({ content: [{ type: 'text', text: '[1,2]' }] })
    expect(api.action.type).to.equal(TAG.CREATE)
    expect(api.action.payload).to.include({ name: 'Foo' })
    expect(api.action.meta).to.include({ agent: 'tropy-spark/1.0' })

    api.respond(3)
    expect(await call('tags.delete', { urlId: 'foo', id: 3 }))
      .to.eql({ content: [] })

    let { content, structuredContent } = await call('projects.list', { open: true })
    expect(content[0].text).to.include('/projects/foo.tropy')
    expect(structuredContent.result).to.have.length(1)

    api.respond({ id: 2 })
    await call('lists.show', { urlId: 'foo', id: 2, expand: true })
    expect(api.action.payload).to.include({ id: 2, expand: true })
  })

  it('reports errors as tool errors', async () => {
    for (let [name, args, detail] of [
      ['tags.delete', { urlId: 'foo', id: 0 }, 'must be >= 1'],
      ['tags.find', { urlId: 'missing' }, 'unknown project'],
      ['items.tags.remove', { urlId: 'foo', id: 1, tags: [2] }, 'unknown arguments: tags'],
      ['nope', {}, 'unknown tool']
    ]) {
      let result = await call(name, args)
      expect(result.isError, name).to.be.true
      expect(result.content[0].text, name).to.include(detail)
    }
  })

  it('opens tropy:// urls', async () => {
    let result = await call('open', { url: 'tropy://project/foo' })

    expect(api.proto.handle.mock.calls[0].arguments[0])
      .to.equal('tropy://project/foo')
    expect(result.structuredContent).to.eql({ url: 'tropy://project/foo' })
  })
})
