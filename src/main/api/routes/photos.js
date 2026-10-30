import { basename, dirname } from 'node:path'
import send from '@fastify/send'
import act from '../../../actions/api.js'
import { MIME } from '../../../constants/index.js'
import { fail, found } from '../errors.js'
import { id, idParams, object, withUrlId } from '../schema.js'

const size = { type: 'integer', minimum: 1 }

const description = {
  photo: 'Renders the photo as shown in Tropy, with its adjustments, ' +
    'e.g. rotation, or a region of it. Not found if the region lies ' +
    'outside the photo.',
  selection: 'Renders the selection with its own adjustments, e.g. ' +
    'rotation, which are independent of the photo.'
}

// Shared by photos.show and items.photos.find.
export const photoFields =
  'width and height are the pixel size of the file, ' +
  'before EXIF orientation. angle and mirror are the rotation and ' +
  'mirroring shown in Tropy, on top of the EXIF orientation.'

// Shared by /photos and /selections.
const extract = (type) => ({
  schema: {
    operationId: `${type}s.extract`,
    summary: `Extract the ${type} image`,
    description: description[type],
    params: withUrlId({ id, format: { enum: ['jpg', 'png', 'webp'] } }),
    querystring: object({
      ...(type === 'photo' && {
        region: {
          type: 'string',
          pattern: '^\\d+,\\d+,[1-9]\\d*,[1-9]\\d*$',
          description: 'Crop to x,y,width,height in pixels of the photo ' +
            'as shown, i.e. after rotation and mirroring; ' +
            'clipped to the photo. Applied before width and height.'
        }
      }),
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
    }, { ...query, region: parseRegion(query.region) })))

    return reply
      .type(MIME[payload.format.toUpperCase()] || 'application/octet-stream')
      .send(Buffer.from(payload.data))
  }
})

const parseRegion = (region) => {
  if (region == null) return
  let [x, y, width, height] = region.split(',').map(Number)
  return { x, y, width, height }
}

export default async function photos (fastify) {
  fastify.get('/photos/:id', {
    schema: {
      operationId: 'photos.show',
      summary: 'Show a photo',
      description: photoFields,
      params: idParams
    }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.photo.show({ id: params.id }))))

  fastify.get('/photos/:id/file.:format', extract('photo'))

  fastify.get('/photos/:id/original', {
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

  fastify.get('/selections/:id', {
    schema: {
      operationId: 'selections.show',
      summary: 'Show a selection',
      description: 'x, y, width and height are pixels in the photo before ' +
        'its angle and mirror are applied; for photos with an EXIF ' +
        'orientation, the space depends on the file type. angle, mirror ' +
        'and adjustments are the selection\'s own, independent of the photo.',
      params: idParams
    }
  }, async ({ params, rsvp }) =>
    found(await rsvp(act.selection.show({ id: params.id }))))

  fastify.get('/selections/:id/file.:format', extract('selection'))
}
