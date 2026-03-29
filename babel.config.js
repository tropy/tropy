export default function (api) {
  api.cache(true)

  return {
    plugins: [
      'babel-plugin-react-compiler'
    ],
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    targets: {
      electron: '41'
    }
  }
}
