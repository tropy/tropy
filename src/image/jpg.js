import { TextDecoder } from 'node:util'

const COM = Buffer.from([0xFF, 0xFE])

export function *getSegments(buffer, marker) {
  let offset = buffer.indexOf(marker)

  while (offset !== -1) {
    let size = buffer.slice(offset + 2).readUInt16BE()

    if (size === 0 || buffer.length < offset + size + 2)
      continue

    let segment = buffer.slice(offset + 4, offset + size + 2)

    yield segment

    offset = buffer.indexOf(marker, offset + size + 2)
  }
}

export function *getComments(buffer, maxLength) {
  let tc = new TextDecoder('utf-8', { fatal: true })

  for (let segment of getSegments(buffer, COM)) {
    try {
      let comment = tc.decode(segment)

      if (comment.length < maxLength)
        yield comment

    } catch (e) {
      if (!(e instanceof TypeError))
        throw e
    }
  }
}
