import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import stylistic from '@stylistic/eslint-plugin'

let style = stylistic.configs.customize({
  arrowParens: false,
  blockSpacing: true,
  braceStyle: '1tbs',
  commaDangle: 'only-multiline'
})

Object.assign(style.rules, {
  '@stylistic/arrow-parens': 0,
  '@stylistic/jsx-closing-bracket-location': 0,
  '@stylistic/jsx-tag-spacing': 0,
  '@stylistic/generator-star-spacing': 0,
  '@stylistic/yield-star-spacing': 0,
  '@stylistic/max-statements-per-line': 0,
  '@stylistic/multiline-ternary': 0,
  '@stylistic/no-multi-spaces': [2, { ignoreEOLComments: true }],
  '@stylistic/new-parens': 0,
  '@stylistic/quotes': [1, 'single', { avoidEscape: true }],
  '@stylistic/no-multiple-empty-lines': [1, { max: 4 }],
  '@stylistic/operator-linebreak': 0,
  '@stylistic/padded-blocks': 0
})

style.rules['@stylistic/indent'][0] = 'warn'
style.rules['@stylistic/indent-binary-ops'][0] = 'warn'

export default [
  js.configs.recommended,
  style,

  {
    ignores: [
      // Enable once import contraints are supported
      'scripts/db.js',
      'src/common/release.js',

      'lib/*',
      'tmp/*'
    ]
  },

  {
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.builtin,
        ...globals.nodeBuiltin
      }
    }
  },

  {
    rules: {
      'eqeqeq': [2, 'smart'],
      'max-depth': [1, 6],
      'complexity': [1, 16],
      'no-shadow': [2, { allow: ['error', 'resolve'] }],
    }
  },

  {
    files: [
      'test/**/*.cjs'
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },

  {
    files: [
      '{src,test}/*.js',
      '{src,test}/!(main)/**/*.js',
      'res/workers/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },

  {
    files: ['test/**/*'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.chai,
        sinon: false,
        F: false
      }
    }
  },

  {
    files: [
      '{src,test}/{components,hooks,views}/**/*.js',
      'test/support/dnd.js',
      'test/support/react.js'
    ],
    plugins: {
      'react': react,
      'react-hooks': reactHooks
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/display-name': 0,
      'react/jsx-key': 2,
      'react/no-deprecated': 1,
      'react/prop-types': 0,
      'react/react-in-jsx-scope': 0
    }
  }
]
