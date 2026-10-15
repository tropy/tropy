export default function (api) {
  api.cache(true)

  return {
    plugins: [
      ['babel-plugin-react-compiler', { panicThreshold: 'all_errors' }]
    ],
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    targets: {
      electron: '41'
    }
  }
}
