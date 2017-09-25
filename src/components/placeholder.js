'use strict'

const React = require('react')
const { injectIntl, intlShape } = require('react-intl')
const { string } = require('prop-types')

const Placeholder = ({ id, intl }) => (
  <div className="placeholder">
    {intl.formatMessage({ id })}
  </div>
)

Placeholder.propTypes = {
  id: string.isRequired,
  intl: intlShape.isRequired
}

module.exports = {
  Placeholder: injectIntl(Placeholder)
}
