const { promisify } = require('node:util')
const ChildProcess = require('node:child_process')
const { existsSync } = require('node:fs')
const { chmod, mkdir, rm, writeFile } = require('node:fs/promises')
const { dirname, join } = require('node:path')
const { platform } = require('node:process')
const { unzipSync } = require('cross-zip')
const { ROOT } = require('./metadata.js')
const { say } = require('./util')('λ')
const exec = promisify(ChildProcess.exec)


async function downloadCodeSignTool(target) {
  let url = (platform === 'win32') ?
    'https://www.ssl.com/download/codesigntool-for-windows/' :
    'https://www.ssl.com/download/codesigntool-for-linux-and-macos/'

  say(`fetching CodeSignTool for ${platform} ...`)
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

async function getCodeSignHook({ cred, user, password, totp }) {
  let codeSignTool = await setupCodeSignTool()
  let cwd = dirname(codeSignTool)

  let params = [
    `-credential_id=${cred}`,
    `-username=${user}`,
    `-password=${password}`,
    `-totp_secret=${totp}`,
    '-override=true'
  ].join(' ')

  return async (path) => {
    console.log('signing', path)
    await exec(
      `${codeSignTool} sign ${params} -input_file_path="${path}"`,
      { cwd })
  }
}

module.exports = {
  setupCodeSignTool,
  getCodeSignHook
}
