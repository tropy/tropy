export default function ({ fileName, source }) {
  return {
    name: 'create-file',

    buildStart() {
      this.emitFile({
        type: 'asset',
        fileName,
        source
      })
    }
  }
}
