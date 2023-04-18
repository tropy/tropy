import { arrayOf, func, string } from 'prop-types'
import { useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { ResourceSelect } from '../resource/select.js'
import { getPropertyList } from '../../selectors/ontology.js'

export function FieldSelect({ value, onInsert, onCancel }) {
  let options = useSelector(getPropertyList)

  let handleClose = useEvent(event => {
    if (event?.type === 'escape') onCancel?.()
  })

  return (
    <ResourceSelect
      autofocus
      canClearByBackspace={false}
      hideClearButton
      isRequired
      isSelectionHidden
      isValueHidden
      maxRows={6}
      options={options}
      placeholder="panel.metadata.dropdown.placeholder"
      value={value}
      onClose={handleClose}
      onBlur={onCancel}
      onInsert={onInsert}/>
  )
}

FieldSelect.propTypes = {
  value: arrayOf(string),
  onCancel: func,
  onInsert: func.isRequired
}
