import { useEventHandler } from './use-event-handler.js'

export function useGlobalEvent(name, callback) {
  useEventHandler(
    document,
    name != null ? `global:${name}` : null,
    callback,
    true)
}
