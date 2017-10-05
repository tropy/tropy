'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, object, shape, string } = require('prop-types')
const { Editor } = require('../editor')
const { TABS } = require('../../constants')


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

  handleEditorBlur = () => {
    const { note } = this.props
    this.props.onCommit(note, note.text.length === 0)
  }

  render() {
    const { note, keymap, tabIndex } = this.props

    return (
      <section className="note pad">
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
      state: object,
      text: string.isRequried
    }).isRequired,
    tabIndex: number.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired
  }

  static defaultProps = {
    tabIndex: TABS.NotePad
  }
}

module.exports = {
  NotePad
}
