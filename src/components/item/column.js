import { Id, Label } from '../resource/select.js'
import { PopoverSelect } from '../resource/popover.js'
import { IconTick } from '../icons.js'

export const ColumnContextMenu = (props) => (
  <PopoverSelect
    {...props}
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
