export default function (api) {
  api.cache(true)

  return {
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    targets: {
      electron: '41'
    }
  }
}
