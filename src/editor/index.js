import { EditorState } from 'prosemirror-state'
import { createCommands } from './commands.js'
import { createPlugins } from './plugins.js'
import { nodeViews, schema } from './schema.js'

export * from './serialize.js'
export { nodeViews, schema }

export const commands = createCommands(schema)
export const plugins = createPlugins(schema)

export function isBlank(doc) {
  if (doc == null)
    return true
  if (doc.childCount !== 1)
    return false
  if (!doc.firstChild.isTextblock)
    return false
  if (doc.firstChild.content.size !== 0)
    return false

  return true
}

export function toEditorState(state) {
  if (state instanceof EditorState)
    return state

  if (state == null)
    return EditorState.create({ schema, plugins })

  return EditorState.fromJSON({ schema, plugins }, state)
}
