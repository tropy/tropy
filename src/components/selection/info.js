import React from 'react'
import { StaticField } from '../metadata/field'
import { instanceOf, shape, number } from 'prop-types'
import { datetime, number as num } from '../../format'

export const SelectionInfo = ({ selection }) => (
  <ol className="selection-info metadata-fields">
    <StaticField
      label="selection.size"
      value={`${num(selection.width)}×${num(selection.height)}`}/>
    <StaticField
      label="selection.created"
      value={datetime(selection.created)}/>
    <StaticField
      label="selection.modified"
      value={datetime(selection.modified)}/>
  </ol>
)

SelectionInfo.propTypes = {
  selection: shape({
    created: instanceOf(Date),
    modified: instanceOf(Date),
    height: number.isRequired,
    width: number.isRequired
  }).isRequired
}
