// JSX compilation hook for renderer tests.
// Hooks into Module._extensions to transform matched files with Babel.
if (process.type === 'renderer') {
  let Module = require('node:module')
  let { transformSync } = require('@babel/core')

  let match = (filename) =>
    /[/\\]src[/\\](components|hooks|views)[/\\]/.test(filename) ||
    /[/\\]test[/\\]components[/\\]/.test(filename) ||
    /[/\\]test[/\\]support[/\\].*\.cjs$/.test(filename)

  let transform = (code, filename) =>
    transformSync(code, {
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
    }).code

  let jsLoader = Module._extensions['.js']

  for (let ext of ['.js', '.cjs']) {
    let oldLoader = Module._extensions[ext] || jsLoader

    Module._extensions[ext] = function (mod, filename) {
      if (match(filename)) {
        let compile = mod._compile
        mod._compile = function (code) {
          mod._compile = compile
          return mod._compile(transform(code, filename), filename)
        }
      }
      oldLoader(mod, filename)
    }
  }
}
