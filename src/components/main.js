'use strict'

const { Provider, connect } = require('react-redux')
const ReactIntl = require('react-intl')
const React = require('react')
const { Component, PropTypes } = React
const { DragDropContext } = require('react-dnd')
const HTML5Backend = require('react-dnd-html5-backend')

const IntlProvider = connect(state => {
  return {
    ...state.intl, key: state.intl.locale
  }
})(ReactIntl.IntlProvider)

// Need component for React DnD
// eslint-disable-next-line react/prefer-stateless-function
class Main extends Component {
  render() {
    return (
      <Provider store={this.props.store}>
        <IntlProvider>
          {this.props.children}
        </IntlProvider>
      </Provider>
    )
  }

  static propTypes = {
    children: PropTypes.element.isRequired,
    store: PropTypes.object.isRequired
  }
}

module.exports = {
  Main: DragDropContext(HTML5Backend)(Main)
}
