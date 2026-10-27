import act from '../../../actions/api.js'
import { found } from '../errors.js'
import { id, idParams, object, one, withUrlId } from '../schema.js'

export default async function notes (api) {
  api.get('/notes/:id', {
    schema: {
      operationId: 'notes.show',
      summary: 'Show a note',
      produces: ['application/json', 'text/html', 'text/plain', 'text/markdown'],
      params: idParams
    }
  }, async ({ format, params, rsvp }) =>
    found(await rsvp(act.note.show({ id: params.id, format }))))

  api.post('/notes', {
    schema: {
      operationId: 'notes.create',
      summary: 'Create a note on a photo or selection',
      params: withUrlId(),
      body: {
        ...object({
          html: { type: 'string', minLength: 1, description: 'Note text as HTML' },
          photo: id,
          selection: id
        }, ['html']),
        ...one('photo', 'selection')
      }
    }
  }, async ({ body, rsvp }, reply) => {
    let payload = found(await rsvp(act.note.create(body)))

    reply.code(201)
    return { id: Object.values(payload).map(note => note.id) }
  })

  api.delete('/notes/:id', {
    schema: { operationId: 'notes.delete', summary: 'Delete a note', params: idParams }
  }, async ({ params, rsvp }) => {
    found(await rsvp(act.note.delete([params.id])))
  })
}
