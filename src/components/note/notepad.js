'use strict'

const React = require('react')
const { PropTypes } = React
const cx = require('classnames')
const { object } = PropTypes

const NotePad = () => (
  <section className={cx({ note: true })}/>
)

NotePad.propTypes = {
  note: object
}

module.exports = {
  NotePad
}
