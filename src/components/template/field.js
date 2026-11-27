import { useRef } from 'react'
import cx from 'classnames'
import { DataTypeSelect, PropertySelect } from '../resource/select.js'
import { PlusMinusControls } from '../button.js'
import { FormElement, FormField, FormToggle } from '../form.js'
import { IconGrip } from '../icons.js'
import { bounds } from '../../dom.js'
import { useDragSource } from '../../hooks/use-drag-source.js'
import { useDropTarget } from '../../hooks/use-drop-target.js'


export const TemplateField = ({
  field,
  isDisabled,
  isSingle,
  isTransient,
  onInsert,
  onRemove,
  onSave,
  onSort,
  onSortReset,
  onSortPreview,
  onSortStart,
  position
}) => {

  let container = useRef()

  let isDragAndDropEnabled = !isDisabled && !isSingle
  let isEditable = !(isDisabled || isTransient)

  let [{ isDragging }, drag] = useDragSource({
    isDisabled: !isDragAndDropEnabled,
    getData: () => ({ type: 'template.field', field }),
    onDragStart: () => {
      onSortStart(field)
    },
    onDrop: (data, dropTargets) => {
      if (dropTargets.length > 0)
        onSort(data.field)
      else
        onSortReset(data.field)
    }
  })

  let [, drop] = useDropTarget({
    accept: 'template.field',
    isDisabled: !isDragAndDropEnabled,
    onDrag: (data, { input: { clientY } }) => {
      if (data.field === field || !container.current)
        return

      let { top, height } = bounds(container.current)
      let offset = Math.round((clientY - top) / height)

      onSortPreview(data.field, field, offset)
    }
  })

  let handleChange = (data) => {
    onSave(field.id, data, position)
  }

  let propsFor = (name) => ({
    id: `${position}.template.field.${name}`,
    isCompact: true,
    isDisabled: !isEditable,
    label: `template.field.${name}`,
    name,
    onChange: handleChange,
    tabIndex: 0,
    value: field[name]
  })

  return (
    <li
      ref={(node) => {
        container.current = node
        drop(node)
      }}
      className={cx('template-field', {
        dragging: isDragging
      })}>
      <fieldset ref={drag}>
        {isDragAndDropEnabled && <IconGrip/>}
        <FormElement
          id={`${position}.template.field.property`}
          isCompact
          label="template.field.property">
          <PropertySelect
            id={`${position}.template.field.property`}
            value={field.property}
            maxRows={5}
            isRequired={!isTransient}
            isDisabled={isDisabled}
            placeholder="property.select"
            tabIndex={0}
            onChange={({ id }) => handleChange({ property: id })}/>
        </FormElement>

        <FormField {...propsFor('label')}/>

        <FormElement
          id={`${position}.template.field.datatype`}
          isCompact
          label="template.field.datatype">
          <DataTypeSelect
            id={`${position}.template.field.datatype`}
            value={field.datatype}
            maxRows={5}
            isRequired
            isDisabled={!isEditable}
            placeholder="datatype.select"
            tabIndex={0}
            onChange={({ id }) => handleChange({ datatype: id })}/>
        </FormElement>

        <FormToggle {...propsFor('isRequired')}/>
        <FormField {...propsFor('hint')}/>
        <FormField {...propsFor('value')}/>
        <FormToggle {...propsFor('isConstant')}/>

      </fieldset>
      {isDisabled ?
          <div className="btn-group"/> : (
            <PlusMinusControls
              canAdd={!isTransient}
              canRemove={!(isTransient || isSingle)}
              onAdd={() => onInsert(field, position + 1)}
              onRemove={() => onRemove(field)}/>
          )}
    </li>
  )
}
