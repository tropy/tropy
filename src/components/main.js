import React from 'react'
import { Provider, connect } from 'react-redux'
import { IntlProvider as ReactIntlProvider } from 'react-intl'
import { DndProvider, ElectronBackend } from './dnd.js'
import { Flash } from './flash.js'
import { WindowContext } from './window.js'

const IntlProvider = connect(
  ({ intl }) => ({ ...intl, key: intl.locale })
)(ReactIntlProvider)

export class Main extends React.Component {
  componentDidMount() {
    this.props.window.send('react:ready')
  }

  render() {
    return (
      <WindowContext.Provider value={this.props.window}>
        <DndProvider backend={ElectronBackend}>
          <Provider store={this.props.store}>
            <IntlProvider>
              <>
                {this.props.children}
                <Flash/>
              </>
            </IntlProvider>
          </Provider>
        </DndProvider>
      </WindowContext.Provider>
    )
  }
}
