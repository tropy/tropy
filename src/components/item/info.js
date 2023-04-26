import React from 'react'
import { useIntl } from 'react-intl'
import { object } from 'prop-types'
import { MetadataField } from '../metadata/field.js'
import { datetime } from '../../format.js'

export const ItemInfo = React.memo(({ item }) => {
  let intl = useIntl()

  return (
    <ol className="item-info metadata-fields">
      <MetadataField
        label={intl.formatMessage({ id: 'item.created' })}
        text={datetime(item.created)}/>
      <MetadataField
        label={intl.formatMessage({ id: 'item.modified' })}
        text={datetime(item.modified)}/>
    </ol>
  )
})

ItemInfo.propTypes = {
  item: object.isRequired
}
