import React from 'react'
import { useIntl } from 'react-intl'
import { MetadataField } from '../metadata/field.js'
import { datetime, number } from '../../format.js'

export const SelectionInfo = React.memo(({ selection }) => {
  let intl = useIntl()

  return (
    <ol className="selection-info metadata-fields">
      <MetadataField
        label={intl.formatMessage({ id: 'selection.size' })}
        text={`${number(selection.width)}×${number(selection.height)}`}/>
      <MetadataField
        label={intl.formatMessage({ id: 'selection.created' })}
        text={datetime(selection.created)}/>
      <MetadataField
        label={intl.formatMessage({ id: 'selection.modified' })}
        text={datetime(selection.modified)}/>
    </ol>
  )
})
