import React from 'react'
import { injectIntl } from 'react-intl'
import { Toolbar } from '../toolbar.js'
import { Input } from '../input.js'
import { ensure } from '../../dom.js'

class LinkContext extends React.PureComponent {
  input = React.createRef()
  container = React.createRef()

  componentDidUpdate({ isActive: wasActive }) {
    if (!wasActive && this.props.isActive) {
      ensure(
        this.container.current,
        'transitionend',
        this.input.current.focus,
        650)
    }
  }

  getLabelFor(name) {
    return this.props.intl.formatMessage({
      id: `editor.commands.link.${name}`
    })
  }

  handleTargetChange = (href) => {
    this.props.onCommit({ href })
  }

  render() {
    return (
      <Toolbar.Context
        className="link"
        ref={this.container}
        isActive={this.props.isActive}>
        <Toolbar.Left className="form-inline">
          {this.props.isActive && (
            <Input
              ref={this.input}
              className="form-control link-target"
              isReadOnly={this.props.isReadOnly}
              isRequired
              placeholder={this.getLabelFor('target')}
              value={this.props.href}
              onBlur={this.props.onBlur}
              onCancel={this.props.onCancel}
              onCommit={this.handleTargetChange}/>
          )}
        </Toolbar.Left>
      </Toolbar.Context>
    )
  }

  static defaultProps = {
    href: '',
    onBlur: () => true // cancel on blur!
  }
}

const LinkContextContainer = injectIntl(LinkContext)

export {
  LinkContextContainer as LinkContext
}
