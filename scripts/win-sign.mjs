import { promisify } from 'node:util'
import ChildProcess from 'node:child_process'
import { existsSync } from 'node:fs'
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { env, platform } from 'node:process'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'cross-zip'

const exec = promisify(ChildProcess.exec)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function downloadCodeSignTool(target) {
  let url = (platform === 'win32') ?
    'https://www.ssl.com/download/codesigntool-for-windows/' :
    'https://www.ssl.com/download/codesigntool-for-linux-and-macos/'

  console.log('fetching CodeSignTool ...')
  let res = await fetch(url)
  if (res.status !== 200) {
    throw new Error(`download failed: ${res.status}`)
  }

  await writeFile(target, Buffer.from(await res.arrayBuffer()))
}

async function setupCodeSignTool(force = false) {
  let dir = join(ROOT, 'vendor', 'code-sign-tool', platform)
  let zip = join(dir, 'CodeSignTool.zip')
  let exe = join(dir, `CodeSignTool.${platform === 'win32' ? 'bat' : 'sh'}`)

  if (force) {
    rm(dir, { recursive: true })
  }
  mkdir(dir, { recursive: true })

  if (!existsSync(zip)) {
    await downloadCodeSignTool(zip)
  }

  if (!existsSync(exe)) {
    unzipSync(zip, dir)
  }

  if (platform !== 'win32') {
    await chmod(exe, 0o755)
  }

  return exe
}

export default async function sign(filePath) {
  let codeSignTool = await setupCodeSignTool()
  //let cwd = dirname(codeSignTool)

  //let params = [
  //  `-credential_id=${env.SIGN_CRED}`,
  //  `-username=${env.SIGN_USER}`,
  //  `-password=${env.SIGN_PASS}`,
  //  `-totp_secret=${env.SIGN_TOTP}`,
  //  '-override=true'
  //].join(' ')

  console.log(`${codeSignTool} sign ${filePath}`)

  //await exec(
  //  `${codeSignTool} sign ${params} -input_file_path="${filePath}"`,
  //  { cwd })
}
