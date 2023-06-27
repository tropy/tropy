import { execFile } from '../common/spawn.js'

export async function gsettings(cmd, ...args) {
  let { stdout } = await execFile('gsettings', [cmd, ...args], {
    encoding: 'utf-8'
  })

  return stdout.trim()
}

export async function get(schema, key) {
  return GVariantParse(await gsettings('get', schema, key))
}

// See: https://docs.gtk.org/glib/gvariant-text.html
export function GVariantParse(string) {
  if (string === 'true')
    return true
  if (string === 'false')
    return false
  if ((/^('.*'|".*")$/).test(string))
    return string.slice(1, -1)

  // We currently don't need to support other types.

  throw new Error(`Failed to parse GVariant: ${string}`)
}
