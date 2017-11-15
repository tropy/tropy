'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { bool, func, instanceOf } = require('prop-types')
const { EditorState } = require('prosemirror-state')
const { injectIntl, intlShape } = require('react-intl')

const { ToolbarContext } = require('../toolbar')
const { IconButton } = require('../button')
const { IconLink } = require('../icons')

class LinkToolbar extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: ''
    }
  }

  handleChange = (e) => {
    this.setState({ value: e.target.value })
  }

  handleCommit = () => {
    if (!this.isValid()) {
      return
    }

    this.props.action(this.state.value) // dispatch the toggleMark command
    this.cancel()
  }

  cancel = () => {
    // hide the toolbar
    this.setState({ value: '' })
    this.props.cancel()
  }

  handleKeyUp = (event) => {
    switch (event.key) {
      case 'Escape':
        this.cancel()
        break
      case 'Enter':
        this.handleCommit()
        break
    }

    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  t = (id) => this.props.intl.formatMessage({ id })

  isValid = () => {
    return this.state.value.length
  }

  render() {
    return (
      <ToolbarContext
        isActive={this.props.isActive}>
        <span className="toolbar-left form-inline">
          <input
            className="form-control link-target"
            placeholder={this.t('editor.commands.link.placeholder')}
            onKeyUp={this.handleKeyUp}
            value={this.state.value}
            onChange={this.handleChange} />
          <span
            className="btn btn-primary"
            disabled={!this.isValid()}
            onClick={this.handleCommit}>OK</span>
        </span>
      </ToolbarContext>
    )
  }

  static propTypes = {
    isActive: bool.isRequired,
    cancel: func.isRequired,
    action: func.isRequired,
    intl: intlShape.isRequired
  }
}

class LinkButton extends PureComponent {
  handleClick = () => {
    // if selection already has a link - remove it straight away
    // otherwise, show link toolbar
    return this.props.mark ? this.props.action() : this.props.callback()
  }

  render() {
    return (
      <IconButton
        isDisabled={!!this.props.state.selection.$cursor}
        canHaveFocus={false}
        title="editor.commands.link.button"
        icon={<IconLink/>}
        onClick={this.handleClick}
        isActive={this.props.mark}/>
    )
  }

  static propTypes = {
    state: instanceOf(EditorState).isRequired,
    mark: bool.isRequired,
    callback: func.isRequired,
    action: func.isRequired
  }
}

module.exports = {
  LinkToolbar: injectIntl(LinkToolbar),
  LinkButton
}
