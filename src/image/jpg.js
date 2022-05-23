
const COM = Buffer.from([0xFF, 0xFE])

export function *getSegments(buffer, marker) {
  let offset = buffer.indexOf(marker)

  while (offset !== -1) {
    let size = buffer.slice(offset + 2).readUInt16BE()
    let segment = buffer.slice(offset + 4, offset + size + 2)

    yield segment

    offset = buffer.indexOf(marker, offset + size + 2)
  }
}

export function *getComments(buffer) {
  for (let segment of getSegments(buffer, COM))
    yield segment.toString()
}
