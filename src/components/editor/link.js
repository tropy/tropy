import React from 'react'
import { bool, func, object } from 'prop-types'
import { injectIntl } from 'react-intl'
import { Toolbar } from '../toolbar'
import { Input } from '../input'
import { ensure } from '../../dom'

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
          <Input
            ref={this.input}
            className="form-control link-target"
            isDisabled={!this.props.isActive}
            isReadOnly={this.props.isReadOnly}
            isRequired
            placeholder={this.getLabelFor('target')}
            value=""
            onBlur={this.props.onBlur}
            onCancel={this.props.onCancel}
            onCommit={this.handleTargetChange}/>
        </Toolbar.Left>
      </Toolbar.Context>
    )
  }

  static propTypes = {
    isActive: bool,
    isReadOnly: bool,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onCommit: func.isRequired,
    intl: object.isRequired
  }

  static defaultProps = {
    onBlur: () => true // cancel on blur!
  }
}


const LinkContextContainer = injectIntl(LinkContext)

export {
  LinkContextContainer as LinkContext
}
