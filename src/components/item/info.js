import React from 'react'
import { StaticField } from '../metadata'
import { object } from 'prop-types'
import { datetime } from '../../format'


export const ItemInfo = ({ item }) => (
  <ol className="item-info metadata-fields">
    <StaticField
      label="item.created"
      value={datetime(item.created)}/>
    <StaticField
      label="item.modified"
      value={datetime(item.modified)}/>
  </ol>
)

ItemInfo.propTypes = {
  item: object.isRequired
}
