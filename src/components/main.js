import React from 'react'
import { Provider, connect } from 'react-redux'
import { IntlProvider as ReactIntlProvider } from 'react-intl'
import { Flash } from './flash.js'
import { DragImagePortal } from './drag-image-portal.js'
import { ThumbnailProvider } from './photo/thumbnail.js'
import { WindowContext } from './window.js'

const IntlProvider = connect(
  ({ intl }) => ({ ...intl, key: intl.locale })
)(ReactIntlProvider)

export class Main extends React.Component {
  componentDidMount () {
    this.props.window.toggle('react')
    this.props.window.send('react:ready')
  }

  render () {
    return (
      <WindowContext.Provider value={this.props.window}>
        <Provider store={this.props.store}>
          <IntlProvider>
            <ThumbnailProvider>
              {this.props.children}
              <Flash/>
              <DragImagePortal/>
            </ThumbnailProvider>
          </IntlProvider>
        </Provider>
      </WindowContext.Provider>
    )
  }
}
