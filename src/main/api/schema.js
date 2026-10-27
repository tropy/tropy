/**
 * Shared JSON Schemas for API routes.
 *
 * Documentation and MCP is generated based on these,
 * so describe each route and any parameter that is not obvious.
 */

export const id = { type: 'integer', minimum: 1 }
export const ids = { type: 'array', items: id }

export const list = {
  type: 'integer',
  minimum: 0,
  description: 'List id; 0 is the root list'
}

export const strings = {
  type: 'array',
  items: { type: 'string' }
}

export const urlId = {
  type: 'string',
  minLength: 1,
  description: 'The project file basename'
}

// Rejects unknown properties.
export const object = (properties, required) => ({
  type: 'object',
  properties,
  additionalProperties: false,
  ...(required && { required })
})

// Requires at least one of the properties.
export const some = (...names) => ({
  anyOf: names.map(name => ({ required: [name] }))
})

// Requires exactly one of the properties.
export const one = (...names) => ({
  oneOf: names.map(name => ({ required: [name] }))
})

// /projects/:project paths
export const path = (properties) => ({
  type: 'object',
  properties: { project: urlId, ...properties }
})

export const params = path({ id })
