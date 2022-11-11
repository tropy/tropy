import { shell } from 'electron'

export function useOpenExternal() {
  return shell.openExternal
}
