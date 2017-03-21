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

  get isNewNote() {
    return !this.props.note
  }

  get doc() {
    return get(this.props.note, 'doc')
  }

  handleChange = (doc, text) => {
    const { note, onCreate, onChange } = this.props

    if (this.isNewNote) {
      return onCreate({ doc, text })
    }

    onChange({ id: note.id, doc, text })
  }

  render() {
    const { keymap, tabIndex } = this.props

    return (
      <section className={cx({ note: true, pad: true })}>
        <Editor
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
      id: number.isRequired,
      doc: object,
      text: string.isRequired
    }),
    tabIndex: number.isRequired,
    onCreate: func.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    tabIndex: TABS.NotePad
  }
}

module.exports = {
  NotePad
}
