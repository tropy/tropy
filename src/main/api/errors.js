import { STATUS_CODES } from 'node:http'
import fp from 'fastify-plugin'
import { HttpError } from '../../common/error.js'

// API fails with RFC 9457 problem details.

export default fp(async (app) => {
  app.setNotFoundHandler(async ({ method, url }) => {
    throw new HttpError({
      status: 404,
      body: `route not found: ${method} ${url}`
    })
  })

  app.setErrorHandler((error, request, reply) => {
    let status = error.status || error.statusCode

    if (!(status >= 400))
      status = 500

    let title = STATUS_CODES[status]

    if (status >= 500)
      request.log.error({ err: error }, error.message)
    else
      request.log.debug({ err: error }, error.message)

    return reply
      .code(status)
      .type('application/problem+json')
      .send({
        title,
        status,
        ...(error.message !== title && { detail: error.message }),
        code: error.code,
        ...(error.validation && {
          errors: error.validation.map(e => problem(e, error.validationContext))
        })
      })
  })
}, { name: 'errors' })

const problem = ({ instancePath, message, params }, context) => {
  let name = params.missingProperty ?? params.additionalProperty

  return {
    in: context,
    pointer: name == null ? instancePath : `${instancePath}/${name}`,
    detail: message
  }
}
