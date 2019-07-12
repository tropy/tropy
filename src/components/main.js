'use strict'

const React = require('react')
const { Provider, connect } = require('react-redux')
const ReactIntl = require('react-intl')
const { element, object } = require('prop-types')
const { DragDropContext } = require('react-dnd')
const { default: ElectronBackend } = require('react-dnd-electron-backend')
const { Flash } = require('./flash')
const { noop } = require('../common/util')

const WindowContext = React.createContext({
  maximize: noop
})

const IntlProvider = connect(state => {
  return {
    ...state.intl, key: state.intl.locale
  }
})(ReactIntl.IntlProvider)

// eslint-disable-next-line react/prefer-stateless-function
class Main extends React.Component {
  componentDidMount() {
    this.props.window.send('react:ready')
  }

  render() {
    return (
      <WindowContext.Provider value={this.props.window}>
        <Provider store={this.props.store}>
          <IntlProvider>
            <React.Fragment>
              {this.props.children}
              <Flash/>
            </React.Fragment>
          </IntlProvider>
        </Provider>
      </WindowContext.Provider>
    )
  }

  static propTypes = {
    children: element.isRequired,
    store: object.isRequired,
    window: object.isRequired
  }
}

module.exports = {
  Main: DragDropContext(ElectronBackend)(Main),
  WindowContext
}
