import React from 'react'
import { useIntl } from 'react-intl'
import { string } from 'prop-types'

export const Placeholder = ({ id }) => (
  <div className="placeholder">
    {useIntl().formatMessage({ id })}
  </div>
)

Placeholder.propTypes = {
  id: string.isRequired
}
