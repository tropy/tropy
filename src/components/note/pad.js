'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { object } = PropTypes
const { Editor } = require('../editor')
const cx = require('classnames')


//eslint-disable-next-line react/prefer-stateless-function
class NotePad extends PureComponent {
  render() {
    return (
      <section className={cx({ note: true, pad: true })}>
        <Editor/>
      </section>
    )
  }

  static propTypes = {
    note: object
  }
}

module.exports = {
  NotePad
}
