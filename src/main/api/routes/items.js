import act from '../../../actions/api.js'
import { found } from '../errors.js'
import { id, idParams, ids, object, some, strings, withUrlId } from '../schema.js'

// Shared by /items and /lists/:id/items.
export const findItems = ({ operationId, summary, params }) => ({
  schema: {
    operationId,
    summary,
    params,
    querystring: object({
      tag: { ...ids, description: 'Only items with all of these tags' },
      q: { type: 'string', description: 'Full-text search query' },
      sort: {
        type: 'string',
        description: 'Sort by item.created, item.modified, item.template, ' +
          'added (list position) or a metadata property URI; ' +
          'defaults to the title, or added in lists, like the app'
      },
      reverse: {
        type: 'boolean',
        default: false,
        description: 'Sort in descending order'
      }
    })
  },
  async handler ({ params, query, rsvp }) {
    return rsvp(act.item.find({
      tags: query.tag,
      list: params.id,
      sort: { column: query.sort, asc: !query.reverse },
      query: query.q
    }))
  }
})

export default async function items (api) {
  api.post('/import', {
    bodyLimit: 16 * 1024 * 1024,
    schema: {
      operationId: 'items.import',
      summary: 'Import items from image files or JSON-LD data',
      description: 'Requires files or data. ' +
        'Waits until the import is done, which can take a long time: ' +
        'clients may time out while the import continues, ' +
        'so check for the imported items before retrying.',
      params: withUrlId(),
      body: {
        ...object({
          files: { ...strings, description: 'Paths of image files' },
          data: {
            type: ['object', 'array'],
            items: { type: 'object' },
            description: 'Items in Tropy\'s JSON-LD export format'
          },
          list: { ...id, description: 'Add the items to this list' },
          createLists: {
            type: 'boolean',
            description: 'Create lists from the data; defaults to the project setting'
          },
          tagColor: {
            type: 'string',
            description: 'Color of new tags; defaults to the project setting'
          }
        }),
        ...some('files', 'data')
      }
    }
  }, async ({ body, rsvp }, reply) => {
    let { createLists, tagColor, ...rest } = body

    // Imports can take a long time: wait without a timeout.
    let payload = await rsvp(
      act.import(rest, { createLists, tagColor }),
      { timeout: 0 })

    reply.code(201)
    return payload
  })

  api.get('/items', findItems({
    operationId: 'items.find',
    summary: 'Find items',
    params: withUrlId()
  }))

  api.get('/items/:id', {
    schema: { operationId: 'items.show', summary: 'Show an item', params: idParams }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.item.show({ id: params.id }))))

  api.get('/items/:id/photos', {
    schema: {
      operationId: 'items.photos.find',
      summary: 'List the photos of an item',
      params: idParams
    }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.photo.find({ item: params.id }))))

  api.get('/items/:id/tags', {
    schema: {
      operationId: 'items.tags.find',
      summary: 'List the tags of an item',
      params: idParams,
      querystring: object({
        reverse: { type: 'boolean', description: 'Reverse the order' }
      })
    }
  }, async ({ params, query, rsvp }) =>
    found(await rsvp(act.tag.find({
      id: params.id,
      reverse: query.reverse
    }))))

  api.post('/items/:id/tags', {
    schema: {
      operationId: 'items.tags.add',
      summary: 'Add tags to an item',
      params: idParams,
      body: object({
        tags: { ...strings, description: 'Tag ids or names' }
      }, ['tags'])
    }
  }, async ({ body, params, rsvp }) =>
    rsvp(act.tag.add({ id: params.id, ...body })))

  api.delete('/items/:id/tags', {
    schema: {
      operationId: 'items.tags.remove',
      summary: 'Remove tags from an item',
      params: idParams,
      querystring: object({
        tag: { ...strings, description: 'Tag ids or names; all tags if omitted' }
      })
    }
  }, async ({ params, query, rsvp }) =>
    rsvp(query.tag ?
      act.tag.remove({ id: params.id, tags: query.tag }) :
      act.tag.clear({ id: params.id })))

  api.get('/items/:id/transcriptions', {
    schema: {
      operationId: 'items.transcriptions.find',
      summary: 'List the transcriptions of an item',
      description: 'Plain text joins the transcriptions\' text.',
      produces: ['application/json', 'text/plain'],
      params: idParams,
      querystring: object({
        separator: {
          type: 'string',
          pattern: '^[*_=-]+$',
          description: 'Separator line between transcriptions in plain text'
        }
      })
    }
  }, async ({ format, params, query, rsvp }) =>
    found(await rsvp(act.transcription.find({
      id: params.id,
      format,
      separator: query.separator
    }))))
}
