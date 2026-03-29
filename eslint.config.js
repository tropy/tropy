import js from '@eslint/js'
import globals from 'globals'
import stylistic from '@stylistic/eslint-plugin'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,

  {
    ignores: [
      'scripts/db.js',
      'src/common/release.js'
    ]
  },

  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      'eqeqeq': [2, 'smart'],

      '@stylistic/indent': [1, 2, {
        SwitchCase: 1,
        offsetTernaryExpressions: true,
        ignoredNodes: ['ConditionalExpression']
      }],
      '@stylistic/indent-binary-ops': [1, 2],
      '@stylistic/quotes': [1, 'single', { avoidEscape: true }],
      '@stylistic/brace-style': [1, '1tbs', { allowSingleLine: true }],
      '@stylistic/block-spacing': [1, 'always'],
      '@stylistic/comma-dangle': [1, 'only-multiline'],
      '@stylistic/no-multi-spaces': [2, { ignoreEOLComments: true }],
      '@stylistic/no-multiple-empty-lines': [1, { max: 2 }],
    }
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
      ...react.configs.flat['jsx-runtime'].rules,
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
