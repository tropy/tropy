'use strict'

const React = require('react')
const { bool, func, number, object, shape, string } = require('prop-types')
const { Editor } = require('../editor')
const { TABS } = require('../../constants')
const cx = require('classnames')


class NotePad extends React.PureComponent {
  get classes() {
    return ['note-pad', this.props.mode, {
      'disabled': this.props.isDisabled,
      'no-wrap': !this.props.wrap,
      'numbers': this.props.numbers
    }]
  }

  setEditor = (editor) => {
    this.editor = editor
  }

  focus = () => {
    this.editor.view.focus()
  }

  handleChange = (state, hasDocChanged) => {
    if (this.props.isDisabled || this.props.isReadOnly)
      return

    let note = { ...this.props.note, state }

    if (hasDocChanged) {
      note.text = state.doc.textBetween(0, state.doc.content.size, ' ', ' ')
    }

    this.props.onChange(note, hasDocChanged, note.text.length === 0)
  }

  handleContextMenu = (event) => {
    if (!this.props.isDisabled && this.props.note.id != null) {
      this.props.onContextMenu(event, 'notepad', {
        id: this.props.note.id,
        mode: this.props.mode,
        numbers: this.props.numbers,
        wrap: this.props.wrap
      })
    }
  }

  handleEditorBlur = () => {
    const { note } = this.props
    this.props.onCommit(note, note.text.length === 0)
  }

  render() {
    return (
      <section
        className={cx(this.classes)}
        onContextMenu={this.handleContextMenu}>
        <Editor
          ref={this.setEditor}
          state={this.props.note.state}
          keymap={this.props.keymap}
          mode={this.props.mode}
          placeholder="notepad.placeholder"
          hasTitlebar={this.props.hasTitlebar}
          isDisabled={this.props.isDisabled}
          isReadOnly={this.props.isReadOnly}
          tabIndex={this.props.tabIndex}
          onBlur={this.handleEditorBlur}
          onChange={this.handleChange}/>
      </section>
    )
  }

  static propTypes = {
    hasTitlebar: bool,
    isDisabled: bool,
    isReadOnly: bool,
    keymap: object.isRequired,
    note: shape({
      id: number,
      state: object,
      text: string.isRequried
    }).isRequired,
    mode: string.isRequired,
    numbers: bool.isRequired,
    wrap: bool.isRequired,
    tabIndex: number.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onContextMenu: func.isRequired
  }

  static defaultProps = {
    mode: 'horizontal',
    numbers: false,
    tabIndex: TABS.NotePad,
    wrap: true
  }
}

module.exports = {
  NotePad
}
