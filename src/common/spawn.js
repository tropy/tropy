import { promisify } from 'util'
import ChildProcess from 'child_process'

export const execFile = promisify(ChildProcess.execFile)

export async function spawn(cmd, args) {
  try {
    let child = ChildProcess.spawn(cmd, args)

    return new Promise((resolve, reject) => {
      let stdout = ''

      child.stdout?.on('data', data => {
        stdout += data
      })

      child.on('close', code => {
        if (code === 0)
          resolve(stdout)
        else
          reject(new Error(`Command ${cmd} ${args} failed: ${stdout}`))
      })

      child.on('error', error => {
        reject(error)
      })

      // See http://stackoverflow.com/questions/9155289/calling-powershell-from-nodejs
      child.stdin?.end()
    })

  } catch (e) {
    return Promise.reject(e)
  }
}
