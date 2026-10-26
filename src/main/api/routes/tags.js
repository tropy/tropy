import act from '../../../actions/api.js'
import { found } from '../errors.js'
import { ids, object, params } from '../schema.js'

export default async function tags (api) {
  api.get('/tags', {
    schema: {
      operationId: 'tags.find',
      summary: 'List all tags',
      querystring: object({
        name: {
          type: 'string',
          minLength: 1,
          description: 'Only the tag with this name'
        },
        reverse: { type: 'boolean', description: 'Reverse the order' }
      })
    }
  }, async ({ query, rsvp }) => {
    if (query.name == null)
      return rsvp(act.tag.find({ reverse: query.reverse }))

    let tag = await rsvp(act.tag.show({ name: query.name }))
    return tag ? [tag] : []
  })

  api.get('/tags/:id', {
    schema: { operationId: 'tags.show', summary: 'Show a tag', params }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.tag.show({ id: params.id }))))

  api.post('/tags', {
    schema: {
      operationId: 'tags.create',
      summary: 'Create a tag',
      body: object({
        name: { type: 'string', minLength: 1 },
        color: { type: 'string' },
        items: { ...ids, description: 'Tag these items' }
      }, ['name'])
    }
  }, async ({ body, rsvp }, reply) => {
    reply.code(201)
    return rsvp(act.tag.create(body))
  })

  api.delete('/tags/:id', {
    schema: { operationId: 'tags.delete', summary: 'Delete a tag', params }
  }, async ({ params, rsvp }) => {
    found(await rsvp(act.tag.delete(params.id)))
  })
}
