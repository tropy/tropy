'use strict'

const React = require('react')
const { PropTypes } = React
const cn = require('classnames')

const Note = () => (
  <section className={cn({ note: true })}/>
)

Note.propTypes = {
  note: PropTypes.object
}

module.exports = {
  Note
}
