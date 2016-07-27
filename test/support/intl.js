
'use strict'

const React = require('react')

const { IntlProvider, intlShape } = require('react-intl')
const enzyme = require('enzyme')

const provider = new IntlProvider({ locale: 'en' }, {})
const { intl } = provider.getChildContext()

/**
 * When using React-Intl `injectIntl` on components, props.intl is required.
 */
function clone(node) {
  return React.cloneElement(node, { intl })
}

function mount(node, { context, childContextTypes }) {
  return enzyme.mount(
      clone(node), {
        context: { ...context, intl },
        childContextTypes: { intl: intlShape, ...childContextTypes }
      }
    )
}

module.exports = {
  provider,
  intl,
  mount
}
