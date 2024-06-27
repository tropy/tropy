import { exec } from '../common/spawn'
import { read } from './mac-defaults'
import { warn } from '../common/log'

const DARWIN_PAPER = {
  'iso-a3': 'A3',
  'iso-a4': 'A4',
  'iso-a5': 'A5',
  'na-legal': 'Legal',
  'na-letter': 'Letter',
  'tabloid': 'Tabloid'
}

export async function papersize() {
  try {
    switch (process.platform) {
      case 'linux':
        return (await exec('paperconf -N')).stdout.trim()

      case 'darwin':
        return DARWIN_PAPER[
          await read('org.cups.PrintingPrefs', 'DefaultPaperID', 'string')
        ] || 'A4'

      case 'win32':
        return 'A4'
    }
  } catch (e) {
    warn(`failed to fetch system default paper size: ${e.message}`)
  }

  return 'A4'
}
