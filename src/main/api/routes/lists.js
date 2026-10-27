import act from '../../../actions/api.js'
import { found } from '../errors.js'
import { idParams, ids, list, object, withUrlId } from '../schema.js'
import { findItems } from './items.js'

export default async function lists (api) {
  api.get('/lists/:id?', {
    schema: {
      operationId: 'lists.show',
      summary: 'Show a list',
      description: 'The root list, or any list with expand, ' +
        'responds with its child lists instead.',
      params: withUrlId({ id: { ...list, default: 0 } }),
      querystring: object({
        expand: {
          type: 'boolean',
          default: false,
          description: 'Include the child lists\' descendants'
        }
      })
    }
  }, async ({ params, query, rsvp }) =>
    found(await rsvp(act.list.show({
      id: params.id,
      expand: query.expand
    }))))

  api.post('/lists', {
    schema: {
      operationId: 'lists.create',
      summary: 'Create a list',
      params: withUrlId(),
      body: object({
        name: { type: 'string', minLength: 1 },
        parent: { ...list, default: 0, description: 'Parent list id' }
      }, ['name'])
    }
  }, async ({ body, rsvp }, reply) => {
    reply.code(201)
    return rsvp(act.list.create(body))
  })

  api.get('/lists/:id/items', findItems({
    operationId: 'lists.items.find',
    summary: 'Find the items in a list',
    params: idParams
  }))

  api.post('/lists/:id/items', {
    schema: {
      operationId: 'lists.items.add',
      summary: 'Add items to a list',
      params: idParams,
      body: object({ items: ids }, ['items'])
    }
  }, async ({ body, params, rsvp }) =>
    rsvp(act.list.items.add({ id: params.id, ...body })))
}
