const BABEL_CONFIG = {
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-proposal-export-namespace-from',
    'babel-plugin-dynamic-import-node',
    '@babel/plugin-transform-modules-commonjs'
  ]
}

require('@babel/register')(BABEL_CONFIG)
