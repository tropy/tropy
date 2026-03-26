// JSX compilation hook for renderer tests.
// Uses pirates to hook into Module._compile for files that contain JSX.
if (process.type === 'renderer') {
  let { addHook } = require('pirates')
  let { transformSync } = require('@babel/core')

  addHook((code, filename) => {
    let result = transformSync(code, {
      filename,
      configFile: false,
      babelrc: false,
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        ['@babel/plugin-transform-modules-commonjs']
      ],
      sourceMaps: 'inline'
    })
    return result.code
  }, {
    exts: ['.js', '.cjs'],
    matcher: (filename) =>
      /\/src\/(components|views)\//.test(filename) ||
      /\/test\/components\//.test(filename) ||
      /\/test\/support\/.*\.cjs$/.test(filename)
  })
}
