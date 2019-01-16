'use strict'

const React = require('react')
const { Id, Label } = require('../resource/select')
const { PopupSelect } = require('../resource/popup')
const { IconTick } = require('../icons')
const { bool, object, oneOfType } = require('prop-types')

const ColumnContextMenu = (props) => (
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

module.exports = {
  ColumnContextMenu
}
