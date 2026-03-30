import js from '@eslint/js'
import globals from 'globals'
import stylistic from '@stylistic/eslint-plugin'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,

  {
    // TODO remove in ESLint 10+ (parser will support it)
    ignores: [
      'scripts/db.js',
      'src/common/release.js'
    ]
  },

  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.builtin,
        ...globals.nodeBuiltin
      }
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      'eqeqeq': [2, 'smart'],
      'no-empty': [2, { allowEmptyCatch: true }],
      'no-implied-eval': 2,
      'no-new': 2,
      // 'no-return-assign': [2, 'except-parens'],
      'no-self-compare': 2,
      'no-template-curly-in-string': 2,
      'no-throw-literal': 2,
      'no-unused-expressions': [2, {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true
      }],
      'no-unused-vars': [2, { args: 'none' }],
      'no-use-before-define': [2, {
        functions: false,
        classes: false,
        variables: false
      }],
      'prefer-promise-reject-errors': 2,

      '@stylistic/indent': [1, 2, {
        SwitchCase: 1,
        offsetTernaryExpressions: true,
        ignoredNodes: ['ConditionalExpression']
      }],
      '@stylistic/block-spacing': [1, 'always'],
      '@stylistic/brace-style': [1, '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': [1, 'only-multiline'],
      '@stylistic/comma-spacing': [2],
      '@stylistic/dot-location': [1, 'property'],
      '@stylistic/function-call-spacing': 2,
      '@stylistic/indent-binary-ops': [1, 2],
      '@stylistic/key-spacing': [2],
      '@stylistic/keyword-spacing': [2],
      '@stylistic/no-mixed-spaces-and-tabs': [2],
      '@stylistic/no-multi-spaces': [2, { ignoreEOLComments: true }],
      '@stylistic/no-multiple-empty-lines': [1, { max: 2 }],
      '@stylistic/space-before-function-paren': [2, 'always'],
      '@stylistic/space-in-parens': [2, 'never'],
      '@stylistic/space-infix-ops': 2,
      '@stylistic/space-unary-ops': [2, { words: true, nonwords: false }],
      '@stylistic/quotes': [1, 'single', { avoidEscape: true }],
      '@stylistic/semi': [2, 'never']
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
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        F: false,
        ...globals.mocha,
        ...globals.chai
      }
    },
    rules: {
      'no-unused-expressions': 0
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
  },
  {
    ignores: [
      'coverage/', 'db/', 'dist/', 'lib/', 'tmp/', 'vendor/'
    ]
  }
]
