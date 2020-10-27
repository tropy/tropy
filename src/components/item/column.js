import React from 'react'
import { Id, Label } from '../resource/select'
import { PopupSelect } from '../resource/popup'
import { IconTick } from '../icons'
import { bool, object, oneOfType } from 'prop-types'

export const ColumnContextMenu = (props) => (
  <PopupSelect {...props}
    placeholder="select.column.placeholder"
    toText={toColumn}
    {...props}/>
)

const toColumn = (value, props) =>
  <Column column={value} {...props}/>

const Column = ({ column, isSelected, matchData }) => (
  <>
    {isSelected && <IconTick/>}
    <Label resource={column} matchData={matchData}/>
    <Id resource={column} matchData={matchData}/>
  </>
)

Column.propTypes = {
  column: object.isRequired,
  isSelected: bool,
  matchData: oneOfType([bool, object])
}
