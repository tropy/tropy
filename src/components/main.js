'use strict'

const { Provider, connect } = require('react-redux')
const ReactIntl = require('react-intl')
const React = require('react')
const { PropTypes } = React

const IntlProvider = connect(state => {
  return {
    ...state.intl, key: state.intl.locale
  }
})(ReactIntl.IntlProvider)

const Main = ({ store, children }) => (
  <Provider store={store}>
    <IntlProvider>
      {children}
    </IntlProvider>
  </Provider>
)

Main.propTypes = {
  children: PropTypes.element.isRequired,
  store: PropTypes.object.isRequired
}

module.exports = {
  Main
}
