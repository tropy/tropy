export default function (api) {
  api.cache(true)

  return {
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    plugins: [
      ['@babel/plugin-syntax-import-attributes']
    ],
    targets: {
      node: '24.14'
    }
  }
}
