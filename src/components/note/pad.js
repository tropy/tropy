'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { bool, number, object } = PropTypes
const { Editor } = require('../editor')
const cx = require('classnames')


//eslint-disable-next-line react/prefer-stateless-function
class NotePad extends PureComponent {
  render() {
    const { isDisabled, keymap, tabIndex } = this.props

    return (
      <section className={cx({ note: true, pad: true })}>
        <Editor
          keymap={keymap}
          isDisabled={isDisabled}
          tabIndex={tabIndex}/>
      </section>
    )
  }

  static propTypes = {
    isDisabled: bool,
    keymap: object.isRequired,
    note: object,
    tabIndex: number.isRequired
  }
}

module.exports = {
  NotePad
}
