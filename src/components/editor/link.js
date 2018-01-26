'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { bool, func } = require('prop-types')
const { injectIntl, intlShape } = require('react-intl')
const { ToolbarContext, ToolbarLeft } = require('../toolbar')
const { Input } = require('../input')
const { ensure } = require('../../dom')


class LinkToolbar extends PureComponent {
  componentWillReceiveProps(props) {
    if (!this.props.isActive && props.isActive) {
      ensure(
        this.container,
        'transitionend',
        this.input.focus,
        850)
    }
  }

  getLabelFor(name) {
    return this.props.intl.formatMessage({
      id: `editor.commands.link.${name}`
    })
  }

  handleBlur = () => true // cancel on blur

  handleTargetChange = (href) => {
    this.props.onCommit({ href })
  }

  setContainer = (container) => {
    this.container = container
  }

  setInput = (input) => {
    this.input = input
  }

  render() {
    return (
      <ToolbarContext
        className="link"
        dom={this.setContainer}
        isActive={this.props.isActive}>
        <ToolbarLeft className="form-inline">
          <Input
            ref={this.setInput}
            className="form-control link-target"
            isDisabled={!this.props.isActive}
            isRequired
            placeholder={this.getLabelFor('target')}
            value=""
            onBlur={this.handleBlur}
            onCancel={this.props.onCancel}
            onCommit={this.handleTargetChange}/>
        </ToolbarLeft>
      </ToolbarContext>
    )
  }

  static propTypes = {
    isActive: bool.isRequired,
    onCancel: func.isRequired,
    onCommit: func.isRequired,
    intl: intlShape.isRequired
  }
}

module.exports = {
  LinkToolbar: injectIntl(LinkToolbar)
}
