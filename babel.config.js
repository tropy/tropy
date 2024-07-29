import process from 'node:process'

export default function (api) {
  api.cache(true)

  let presets = [
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]

  let plugins = [
    ['@babel/plugin-syntax-import-attributes']
  ]

  let targets = { node: '20.15' }

  if (process.env.COVERAGE) {
    plugins.push(['istanbul', {
      include: ['src/**/*.js']
    }])
  }

  return {
    presets,
    plugins,
    targets
  }
}
