import act from '../../../actions/api.js'
import { found } from '../errors.js'
import { idParams, ids, object, withUrlId } from '../schema.js'

export default async function tags (fastify) {
  fastify.get('/tags', {
    schema: {
      operationId: 'tags.find',
      summary: 'List all tags',
      params: withUrlId(),
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

  fastify.get('/tags/:id', {
    schema: { operationId: 'tags.show', summary: 'Show a tag', params: idParams }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.tag.show({ id: params.id }))))

  fastify.post('/tags', {
    schema: {
      operationId: 'tags.create',
      summary: 'Create a tag',
      params: withUrlId(),
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

  fastify.delete('/tags/:id', {
    schema: { operationId: 'tags.delete', summary: 'Delete a tag', params: idParams }
  }, async ({ params, rsvp }) => {
    found(await rsvp(act.tag.delete(params.id)))
  })
}
