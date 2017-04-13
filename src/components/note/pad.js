'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { bool, func, number, object, shape } = PropTypes
const { Editor } = require('../editor')
const cx = require('classnames')
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

    this.props.onChange(note, hasDocChanged)
  }

  render() {
    const { note, keymap, tabIndex } = this.props

    return (
      <section className={cx({ note: true, pad: true })}>
        <Editor
          ref={this.setEditor}
          state={note.state}
          keymap={keymap}
          isDisabled={this.isDisabled}
          tabIndex={tabIndex}
          onChange={this.handleChange}/>
      </section>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isItemOpen: bool,
    keymap: object.isRequired,
    note: shape({
      state: object
    }).isRequired,
    tabIndex: number.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    tabIndex: TABS.NotePad
  }
}

module.exports = {
  NotePad
}
