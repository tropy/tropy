import act from '../../../actions/api.js'
import { found } from '../errors.js'
import { idParams } from '../schema.js'

export default async function metadata (fastify) {
  fastify.get('/data/:id', {
    schema: {
      operationId: 'metadata.show',
      summary: 'Show the metadata of an item, photo or selection',
      params: idParams
    }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.metadata.show({ id: params.id }))))

  fastify.patch('/data/:id', {
    schema: {
      operationId: 'metadata.save',
      summary: 'Save metadata of an item, photo or selection',
      description: 'Updates the given properties and keeps all others.',
      params: idParams,
      body: {
        type: 'object',
        minProperties: 1,
        description: 'Values by metadata property URI'
      }
    }
  }, async ({ body, params, rsvp }) =>
    rsvp(act.metadata.save({ id: params.id, data: body })))
}
