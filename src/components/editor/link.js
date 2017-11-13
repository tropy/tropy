'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { bool, func, instanceOf } = require('prop-types')
const { EditorState } = require('prosemirror-state')

const { ToolbarContext } = require('../toolbar')
const { BufferedInput } = require('../input')
const { IconButton } = require('../button')
const { IconLink } = require('../icons')

class LinkToolbar extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      url: ''
    }
  }

  handleChange = (url) => {
    this.setState({ url })
  }

  handleCommit = () => {
    this.props.onCommit() // hides the toolbar
    this.props.action(this.state.url) // dispatch the toggleMark command
  }

  render() {
    return (
      <ToolbarContext isActive={this.props.isActive}>
        <span className="toolbar-left form-inline">
          <BufferedInput
            className="form-control link-target"
            tabIndex={-1}
            value={this.state.linkTarget}
            placeholder="Link target"
            onCancel={this.props.onCommit}
            onChange={this.handleChange}
            onCommit={this.handleCommit}/>
          <span
            className="btn btn-primary"
            onClick={this.handleCommit}>OK</span>
        </span>
      </ToolbarContext>
    )
  }

  static propTypes = {
    isActive: bool,
    onCommit: func.isRequired,
    action: func.isRequired
  }
}

class LinkButton extends PureComponent {
  handleClick = () => {
    // if selection already has a link - remove it
    // otherwise, show link toolbar
    return this.props.mark ? this.props.action() : this.props.callback()
  }

  render() {
    return (
      <IconButton
        isDisabled={!!this.props.state.selection.$cursor}
        canHaveFocus={false}
        title="editor.commands.link"
        icon={<IconLink/>}
        onClick={this.handleClick}
        isActive={this.props.mark}/>
    )
  }

  static propTypes = {
    state: instanceOf(EditorState).isRequired,
    mark: bool,
    callback: func.isRequired,
    action: func.isRequired
  }
}

module.exports = {
  LinkToolbar,
  LinkButton
}
