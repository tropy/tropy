import { basename, dirname } from 'node:path'
import send from '@fastify/send'
import act from '../../../actions/api.js'
import { MIME } from '../../../constants/index.js'
import { fail, found } from '../errors.js'
import { id, idParams, object, withUrlId } from '../schema.js'

const size = { type: 'integer', minimum: 1 }

// Shared by /photos and /selections.
const extract = (type) => ({
  schema: {
    operationId: `${type}s.extract`,
    summary: `Extract the ${type} image`,
    description: 'Renders the image with its adjustments, e.g. rotation.',
    params: withUrlId({ id, format: { enum: ['jpg', 'png', 'webp'] } }),
    querystring: object({
      width: { ...size, description: 'Fit within this width (no enlarging)' },
      height: { ...size, description: 'Fit within this height (no enlarging)' },
      quality: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        description: 'Compression quality, for jpg and webp'
      }
    })
  },
  async handler ({ params, query, rsvp }, reply) {
    let payload = found(await rsvp(act.photo.extract({
      [type]: params.id,
      format: params.format
    }, query)))

    return reply
      .type(MIME[payload.format.toUpperCase()] || 'application/octet-stream')
      .send(Buffer.from(payload.data))
  }
})

export default async function photos (api) {
  api.get('/photos/:id', {
    schema: { operationId: 'photos.show', summary: 'Show a photo', params: idParams }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.photo.show({ id: params.id }))))

  api.get('/photos/:id/file.:format', extract('photo'))

  api.get('/photos/:id/original', {
    schema: {
      operationId: 'photos.original',
      summary: 'Download the original photo file as is',
      // Any file type, or a redirect: no MCP tool, use extract instead.
      mcp: false,
      description: 'Supports range and conditional requests. ' +
        'Redirects to photos stored at an HTTP(S) URL.',
      params: idParams
    }
  }, async ({ params, raw, rsvp }, reply) => {
    let { protocol, path, mimetype } =
      found(await rsvp(act.photo.show({ id: params.id })))

    switch (protocol) {
      case 'file': {
        let name = encodeURIComponent(basename(path))
        let { statusCode, headers, stream, type, metadata } =
          await send(raw, name, { root: dirname(path) })

        if (type !== 'file')
          throw metadata.error ?? fail(404, 'not found')

        reply
          .code(statusCode)
          .headers(headers)
          .header('content-disposition', `attachment; filename*=UTF-8''${name}`)

        if (mimetype)
          reply.type(mimetype)

        return reply.send(stream)
      }
      case 'http':
      case 'https':
        return reply.redirect(`${protocol}://${path}`)
      default:
        throw fail(501, `protocol not supported: ${protocol}`)
    }
  })

  api.get('/selections/:id', {
    schema: { operationId: 'selections.show', summary: 'Show a selection', params: idParams }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.selection.show({ id: params.id }))))

  api.get('/selections/:id/file.:format', extract('selection'))
}
