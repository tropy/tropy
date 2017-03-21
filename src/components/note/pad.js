'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { bool, func, number, object, shape, string } = PropTypes
const { Editor } = require('../editor')
const cx = require('classnames')
const { TABS } = require('../../constants')
const { get } = require('../../common/util')


class NotePad extends PureComponent {
  get isDisabled() {
    return !this.props.isItemOpen || this.props.isDisabled
  }

  get doc() {
    return get(this.props.note, 'doc')
  }

  setEditor = (editor) => {
    this.editor = editor
  }

  focus = () => {
    this.editor.view.focus()
  }

  handleChange = (doc, text) => {
    this.props.onChange({ id: this.props.note.id, doc, text })
  }

  render() {
    const { keymap, tabIndex } = this.props

    return (
      <section className={cx({ note: true, pad: true })}>
        <Editor
          ref={this.setEditor}
          doc={this.doc}
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
      id: number,
      doc: object,
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
