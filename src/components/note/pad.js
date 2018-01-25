'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, object, shape, string } = require('prop-types')
const { Editor } = require('../editor')
const { TABS } = require('../../constants')
const cx = require('classnames')


class NotePad extends PureComponent {
  get isDisabled() {
    return !this.props.isItemOpen || this.props.isDisabled
  }

  setEditor = (editor) => {
    this.editor = editor
  }

  focus = () => {
    this.editor.view.focus()
  }

  handleChange = (state, hasDocChanged) => {
    const note = { ...this.props.note, state }

    if (hasDocChanged) {
      note.text = state.doc.textBetween(0, state.doc.content.size, ' ')
    }

    this.props.onChange(note, hasDocChanged, note.text.length === 0)
  }

  handleContextMenu = (event) => {
    if (!this.props.isDisabled && this.props.note.id != null) {
      this.props.onContextMenu(event, 'notepad', {
        id: this.props.note.id,
        mode: this.props.mode,
        wrap: this.props.wrap
      })
    }
  }

  handleEditorBlur = () => {
    const { note } = this.props
    this.props.onCommit(note, note.text.length === 0)
  }

  render() {
    const { mode, note, keymap, tabIndex, wrap } = this.props

    return (
      <section
        className={cx('note', 'pad', mode, { 'no-wrap': !wrap })}
        onContextMenu={this.handleContextMenu}>
        <Editor
          ref={this.setEditor}
          state={note.state}
          keymap={keymap}
          placeholder="notepad.placeholder"
          isDisabled={this.isDisabled}
          tabIndex={tabIndex}
          onBlur={this.handleEditorBlur}
          onChange={this.handleChange}/>
      </section>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isItemOpen: bool,
    keymap: object.isRequired,
    note: shape({
      id: number,
      state: object,
      text: string.isRequried
    }).isRequired,
    mode: string.isRequired,
    wrap: bool.isRequired,
    tabIndex: number.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onContextMenu: func.isRequired
  }

  static defaultProps = {
    mode: 'horizontal',
    tabIndex: TABS.NotePad,
    wrap: true
  }
}

module.exports = {
  NotePad
}
