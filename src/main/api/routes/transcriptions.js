import act from '../../../actions/api.js'
import { found } from '../errors.js'
import { id, idParams, object, one, some, withUrlId } from '../schema.js'

export default async function transcriptions (fastify) {
  fastify.get('/transcriptions/:id', {
    schema: {
      operationId: 'transcriptions.show',
      summary: 'Show a transcription',
      produces: ['application/json', 'text/plain', 'application/xml'],
      params: idParams
    }
  }, async ({ format, params, rsvp }) =>
    found(await rsvp(act.transcription.show({ id: params.id, format }))))

  fastify.post('/transcriptions', {
    schema: {
      operationId: 'transcriptions.create',
      summary: 'Create a transcription of a photo or selection',
      description: 'Requires data or text, and either photo or selection.',
      params: withUrlId(),
      body: {
        ...object({
          data: { type: 'string', description: 'ALTO XML document' },
          text: { type: 'string', description: 'Plain text, if there is no ALTO' },
          angle: { type: 'number', description: 'Rotation of the transcribed image in degrees' },
          mirror: { type: 'boolean', description: 'Whether the transcribed image was mirrored' },
          photo: id,
          selection: id
        }),
        allOf: [some('data', 'text'), one('photo', 'selection')]
      }
    }
  }, async ({ body, rsvp }, reply) => {
    let payload = found(await rsvp(act.transcription.create(body)))

    reply.code(201)
    return { id: Object.values(payload).map(tr => tr.id) }
  })
}
