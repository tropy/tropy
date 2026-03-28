import globals from 'globals'
import neostandard, { plugins } from 'neostandard'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  ...neostandard(),

  {
    ignores: [
      'scripts/db.js',
      'src/common/release.js'
    ]
  },

  {
    rules: {
      'eqeqeq': [2, 'smart'],

      'prefer-const': 0,
      'curly': 0,
      'camelcase': 0,
      'no-return-assign': 0,
      'no-var': 0,
      'no-sequences': 0,
      'no-void': 0,
      'object-shorthand': 0,
      'no-unused-expressions': 0,
      'one-var': 0,
      'yoda': 0,
      '@stylistic/space-before-function-paren': 0,
      '@stylistic/generator-star-spacing': 0,
      '@stylistic/multiline-ternary': 0,
      '@stylistic/quote-props': 0,
      '@stylistic/new-parens': 0,
      '@stylistic/object-curly-newline': 0,
      '@stylistic/object-property-newline': 0,
      '@stylistic/operator-linebreak': 0,
      '@stylistic/padded-blocks': 0,
      '@stylistic/no-multiple-empty-lines': [1, { max: 2 }],
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
        F: false,
        ...globals.mocha,
        ...globals.chai
      }
    }
  },

  {
    files: [
      '{src,test}/{components,hooks,views}/**/*.js',
      'test/support/react.js'
    ],
    plugins: {
      'react': plugins.react,
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
      ...plugins.react.configs.flat.recommended.rules,
      ...plugins.react.configs.flat['jsx-runtime'].rules,
      'react/display-name': 0,
      'react/prop-types': 0,
      ...reactHooks.configs.recommended.rules,
      'react-hooks/immutability': 0,
      'react-hooks/refs': 0,
      'react-hooks/set-state-in-effect': 0,
      'react-hooks/use-memo': 0,
    }
  }
]
