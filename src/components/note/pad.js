'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { bool, func, number, object, shape, string } = PropTypes
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

  render() {
    const { note, keymap, tabIndex, onChange } = this.props

    return (
      <section className={cx({ note: true, pad: true })}>
        <Editor
          ref={this.setEditor}
          state={note.state}
          keymap={keymap}
          isDisabled={this.isDisabled}
          tabIndex={tabIndex}
          onChange={onChange}/>
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
      text: string
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
