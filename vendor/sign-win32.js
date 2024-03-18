const { promisify } = require('node:util')
const ChildProcess = require('node:child_process')
const { existsSync } = require('node:fs')
const { chmod, mkdir, rm, writeFile } = require('node:fs/promises')
const { dirname, extname, join, resolve } = require('node:path')
const { env, platform } = require('node:process')
const { fileURLToPath } = require('node:url')
const { unzipSync } = require('cross-zip')

const exec = promisify(ChildProcess.exec)

async function downloadCodeSignTool(target) {
  let url = (platform === 'win32') ?
    'https://www.ssl.com/download/codesigntool-for-windows/' :
    'https://www.ssl.com/download/codesigntool-for-linux-and-macos/'

  console.log('Fetching CodeSignTool ...')
  let res = await fetch(url)
  if (res.status !== 200) {
    throw new Error(`download failed: ${res.status}`)
  }

  await writeFile(target, Buffer.from(await res.arrayBuffer()))
}

async function setupCodeSignTool(force = false) {
  let dir = join(__dirname, 'code-sign-tool', platform)
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

module.exports = async function sign(filePath) {
  let codeSignTool = await setupCodeSignTool()
  let cwd = dirname(codeSignTool)

  let params = [
    `-credential_id="${env.SIGN_CRED}"`,
    `-username="${env.SIGN_USER}"`,
    `-password="${env.SIGN_PASS}"`,
    `-totp_secret="${env.SIGN_TOTP}"`,
    '-override=true'
  ].join(' ')

  // To keep signature count low we sign only .exe and .node files
  let ext = extname(filePath)
  if (!(ext === '.exe' || ext === '.node'))
    return

  await exec(
    `${codeSignTool} sign ${params} -input_file_path="${filePath}"`,
    { cwd })
}
