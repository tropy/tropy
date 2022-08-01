import React, { useRef } from 'react'
import { array, bool, func, number, object } from 'prop-types'
import cx from 'classnames'
import { ResourceSelect } from '../resource/select.js'
import { PlusMinusControls } from '../button.js'
import { FormElement, FormField, FormToggle } from '../form.js'
import { IconGrip } from '../icons.js'
import { bounds } from '../../dom.js'
import { DND, useDrag, useDrop } from '../dnd.js'


export const TemplateField = ({
  datatypes,
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
  position,
  properties
}) => {

  let container = useRef()

  let isDragAndDropEnabled = !isDisabled && !isSingle
  let isEditable = !(isDisabled || isTransient)

  let [{ isDragging }, drag] = useDrag({
    type: DND.TEMPLATE.FIELD,

    item: () => {
      onSortStart(field)
      return field
    },

    end: (item, monitor) => {
      if (monitor.didDrop())
        onSort(item)
      else
        onSortReset(item)
    },

    canDrag: () => (isDragAndDropEnabled),

    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  let [, drop] = useDrop({
    accept: [DND.TEMPLATE.FIELD],

    drop: (item) => (item),

    hover: (item, monitor) => {
      if (item === field || !container.current)
        return

      let { top, height } = bounds(container.current)
      let offset = Math.round((monitor.getClientOffset().y - top) / height)

      onSortPreview(item, field, offset)
    }
  })

  if (isDragAndDropEnabled)
    drop(container)

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
    size: 9,
    tabIndex: 0,
    value: field[name]
  })

  return (
    <li
      ref={container}
      className={cx('template-field', {
        dragging: isDragging
      })}>
      <fieldset ref={drag}>
        {isDragAndDropEnabled && <IconGrip/>}
        <FormElement
          id={`${position}.template.field.property`}
          isCompact
          label="template.field.property"
          size={9}>
          <ResourceSelect
            id={`${position}.template.field.property`}
            options={properties}
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
          label="template.field.datatype"
          size={9}>
          <ResourceSelect
            id={`${position}.template.field.datatype`}
            options={datatypes}
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
        <div className="btn-group"/> :
        <PlusMinusControls
          canAdd={!isTransient}
          canRemove={!(isTransient || isSingle)}
          onAdd={() => onInsert(field, position + 1)}
          onRemove={() => onRemove(field)}/>}
    </li>
  )
}

TemplateField.propTypes = {
  field: object.isRequired,
  isDisabled: bool,
  isTransient: bool,
  isSingle: bool,
  position: number.isRequired,
  datatypes: array.isRequired,
  properties: array.isRequired,
  onInsert: func.isRequired,
  onRemove: func.isRequired,
  onSave: func.isRequired,
  onSort: func.isRequired,
  onSortPreview: func.isRequired,
  onSortReset: func.isRequired,
  onSortStart: func.isRequired
}
