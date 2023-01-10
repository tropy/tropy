import { EditorState } from 'prosemirror-state'
import { createCommands } from './commands.js'
import { createPlugins } from './plugins.js'
import { nodeViews, schema } from './schema.js'

export * from './serialize.js'
export { nodeViews, schema }
export * from './state.js'

export const commands = createCommands(schema)
export const plugins = createPlugins(schema)

export function toEditorState(state) {
  if (state instanceof EditorState)
    return state

  if (state == null)
    return EditorState.create({ schema, plugins })

  return EditorState.fromJSON({ schema, plugins }, state)
}
