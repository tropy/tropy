import process from 'node:process'
import { register } from 'node:module'

let config = {
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: []
}

if (process.env.COVERAGE)
  config.plugins.push(['istanbul', {
    include: ['src/**/*.js']
  }])

if (process.type === 'renderer') {
  register('./babel-hooks.js', import.meta.url, {
    data: {
      config,
      include: [
        '{src,test}/{components,hooks}/**/*.js'
      ]
    }
  })
}
