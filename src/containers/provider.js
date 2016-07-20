'use strict'

const { Provider: ReduxProvider, connect } = require('react-redux')
const ReactIntl = require('react-intl')
const React = require('react')
const { PropTypes } = React

const IntlProvider = connect(state => {
  return {
    ...state.intl, key: state.intl.locale
  }
})(ReactIntl.IntlProvider)

const Provider = ({ store, children }) => (
  <ReduxProvider store={store}>
    <IntlProvider>
      {children}
    </IntlProvider>
  </ReduxProvider>
)

Provider.propTypes = {
  children: PropTypes.element.isRequired,
  store: PropTypes.object.isRequired
}

module.exports = {
  Provider
}
