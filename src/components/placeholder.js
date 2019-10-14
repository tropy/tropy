'use strict'

const React = require('react')
const { useIntl } = require('react-intl')
const { string } = require('prop-types')

const Placeholder = ({ id }) => (
  <div className="placeholder">
    {useIntl().formatMessage({ id })}
  </div>
)

Placeholder.propTypes = {
  id: string.isRequired
}

module.exports = {
  Placeholder
}
