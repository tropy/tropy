import { product, version } from '../../common/release.js'

// MCP bridge of both local APIs

export default async function mcp (app, { proto }) {
  let handler

  app.route({
    method: ['GET', 'POST', 'DELETE'],
    url: '/mcp',
    schema: { hide: true },
    exposeHeadRoute: false,
    bodyLimit: 16 * 1024 * 1024,
    async handler (request) {
      handler ??= load(app, proto)

      // SDK expects a web Request (and parsedBody)
      let req = new Request(new URL(request.url, 'http://localhost'), {
        method: request.method,
        headers: request.headers
      })

      return (await handler).fetch(req, { parsedBody: request.body })
    }
  })
}

async function load (app, proto) {
  // Load MCP SDK on-demand only
  let { Server, createMcpHandler } = await import('@modelcontextprotocol/server')

  let tools = new Map(
    app.catalog
      .filter(route => route.schema.mcp !== false)
      .map(route => [route.schema.operationId, httpTool(app, route)]))

  if (proto)
    tools.set('open', openTool(proto))

  let list = [...tools.values()].map(({ call, ...tool }) => tool)

  return createMcpHandler(() => {
    let server = new Server(
      { name: product, version },
      { capabilities: { tools: {} } })

    server.setRequestHandler('tools/list', () =>
      ({ tools: list }))

    server.setRequestHandler('tools/call', async ({ params }) => {
      let tool = tools.get(params.name)

      let result = (tool == null) ?
        error(`unknown tool: ${params.name}`) :
        await tool.call(params.arguments ?? {})

      return server.projectCallToolResult(result)
    })

    return server
  })
}

function httpTool (app, { method, url, schema }) {
  let parts = {
    params: names(schema.params),
    query: names(schema.querystring),
    body: names(schema.body)
  }

  let input = {
    type: 'object',
    properties: {
      ...schema.params?.properties,
      ...schema.querystring?.properties,
      ...schema.body?.properties
    },
    required: [
      ...parts.params,
      ...schema.querystring?.required ?? [],
      ...schema.body?.required ?? []
    ],
    additionalProperties: false
  }

  // Bodies without declared properties are passed as a whole.
  let isOpenBody = schema.body != null && schema.body.properties == null

  // Top-level anyOf/oneOf/allOf are left out (LLM APIs reject them):
  // routes state them in their description and validate them.
  if (isOpenBody) {
    input.properties.body = schema.body
    input.required.push('body')
  }

  // Routes with several formats choose one by media type.
  if (schema.produces) {
    input.properties.accept = {
      enum: schema.produces,
      default: schema.produces[0],
      description: 'Media type of the result'
    }
  }

  return {
    name: schema.operationId,
    description: [schema.summary, schema.description]
      .filter(Boolean).join('\n\n'),
    inputSchema: input,
    annotations: {
      readOnlyHint: method === 'GET',
      destructiveHint: method === 'DELETE'
    },

    async call (args) {
      // The SDK does not validate the input: reject unknown names,
      // which would otherwise be dropped silently.
      let unknown = Object.keys(args).filter(name => !(name in input.properties))

      if (unknown.length)
        return error(`unknown arguments: ${unknown.join(', ')}`)

      let path = url.replace(/:(\w+)/g, (_, name) =>
        encodeURIComponent(args[name]))

      let query = new URLSearchParams()

      for (let name of parts.query)
        for (let value of [args[name]].flat())
          if (value != null) query.append(name, value)

      let body = isOpenBody ? args.body : pick(args, parts.body)

      let res = await app.inject({
        method,
        url: query.size ? `${path}?${query}` : path,
        headers: { accept: args.accept ?? '*/*' },
        ...(schema.body && { payload: body })
      })

      return toResult(res)
    }
  }
}

function openTool (proto) {
  let urls = proto.routes
    .map(route => `- ${route.url}: ${route.summary}`)
    .join('\n')

  return {
    name: 'open',
    description: 'Open a tropy:// URL in Tropy, like clicking a link. ' +
      'Projects must be open to use the other tools: ' +
      'open them with the url from projects.list. ' +
      'URL ids and other segments are percent-encoded; ' +
      'parts in [brackets] are optional.\n\n' + urls,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'A tropy:// URL' }
      },
      required: ['url'],
      additionalProperties: false
    },

    async call ({ url }) {
      try {
        let project = await proto.handle(url)

        return {
          content: [{ type: 'text', text: JSON.stringify(project) }],
          structuredContent: project
        }
      } catch (err) {
        return error(err.message)
      }
    }
  }
}

function toResult (res) {
  let type = res.headers['content-type'] ?? ''

  if (res.statusCode >= 400)
    return error(res.body)

  if (res.statusCode === 204)
    return { content: [] }

  if (type.startsWith('image/'))
    return {
      content: [{
        type: 'image',
        data: res.rawPayload.toString('base64'),
        mimeType: type.split(';')[0]
      }]
    }

  let result = { content: [{ type: 'text', text: res.body }] }

  if (type.startsWith('application/json'))
    result.structuredContent = res.json()

  return result
}

const error = (text) => ({
  isError: true,
  content: [{ type: 'text', text }]
})

const names = (schema) =>
  Object.keys(schema?.properties ?? {})

const pick = (args, keys) =>
  Object.fromEntries(keys.filter(k => k in args).map(k => [k, args[k]]))
