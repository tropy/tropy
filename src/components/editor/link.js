'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { bool, func } = require('prop-types')
const { injectIntl, intlShape } = require('react-intl')
const { ToolbarContext } = require('../toolbar')
const { BufferedInput } = require('../input')


class LinkToolbar extends PureComponent {
  componentWillReceiveProps(props) {
    // must be slower than $toolbar-context-transition
    const focusDelay = 250
    // when toolbar becomes active, focus on input
    if (!this.props.isActive && props.isActive) {
      // delay needed because of the way the toolbars slide out
      setTimeout(() => this.input.focus(), focusDelay)
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

  setInput = (input) => {
    this.input = input
  }

  render() {
    return (
      <ToolbarContext isActive={this.props.isActive}>
        <span className="toolbar-left form-inline">
          <BufferedInput
            ref={this.setInput}
            className="form-control link-target"
            isDisabled={!this.props.isActive}
            isRequired
            placeholder={this.getLabelFor('target')}
            value=""
            onBlur={this.handleBlur}
            onCancel={this.props.onCancel}
            onCommit={this.handleTargetChange}/>
        </span>
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
