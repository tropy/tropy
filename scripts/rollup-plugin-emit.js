export default function ({ entries, implicitlyLoadedAfterOneOf }) {
  return {
    name: 'emit',
    buildStart() {
      for (let name in entries) {
        this.emitFile({
          type: 'chunk',
          id: entries[name],
          name,
          fileName: `${name}.js`,
          implicitlyLoadedAfterOneOf
        })
      }
    }
  }
}
