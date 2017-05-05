'use strict'

const React = require('react')
const { PureComponent } = React
const { DragSource, DropTarget } = require('react-dnd')
const { PropertySelect } = require('../property/select')
const { IconButton } = require('../button')
const { FormField, FormGroup, Label } = require('../form')
const { IconGrip, IconPlusCircle, IconMinusCircle } = require('../icons')
const { get, titlecase } = require('../../common/util')
const { basename } = require('path')
const { DND } = require('../../constants')
const { array, bool, func, object } = require('prop-types')
const { bounds } = require('../../dom')
const { round } = Math


class TemplateField extends PureComponent {

  get uri() {
    return get(this.props.field, ['property', 'uri']) || ''
  }

  get defaultLabel() {
    return get(this.props.field, ['property', 'label'])
      || titlecase(basename(this.uri))
  }

  setContainer = (container) => {
    this.container = container
  }

  handlePropertyChange = () => {
  }

  handleInsert = () => {
    this.props.onInsert(this.props.field)
  }

  handleRemove = () => {
    this.props.onRemove(this.props.field)
  }

  render() {
    return this.props.dt(
      <li
        className="template-field"
        ref={this.setContainer}>
        <IconGrip/>
        {this.props.ds(
          <fieldset>
            <FormGroup isCompact>
              <Label id="template.field.property"/>
              <div className="col-9">
                <PropertySelect
                  properties={this.props.properties}
                  selected={this.uri}
                  isRequired={false}
                  placeholder="property.select"
                  onChange={this.handlePropertyChange}/>
              </div>
            </FormGroup>
            <FormField
              id="template.field.label"
              name="label"
              value={this.props.field.label || ''}
              placeholder={this.defaultLabel}
              onChange={this.handlePropertyChange}/>
            <FormField
              id="template.field.hint"
              name="hint"
              value={this.props.field.hint || ''}
              onChange={this.handlePropertyChange}/>
          </fieldset>
        )}
        <IconButton
          icon={<IconPlusCircle/>}
          onClick={this.handleInsert}/>
        <IconButton
          icon={<IconMinusCircle/>}
          onClick={this.handleRemove}/>
      </li>
    )
  }

  static propTypes = {
    field: object.isRequired,
    isDragging: bool,
    isOver: bool,
    properties: array.isRequired,
    ds: func.isRequired,
    dt: func.isRequired,
    onInsert: func.isRequired,
    onRemove: func.isRequired,
    onSort: func.isRequired,
    onSortPreview: func.isRequired,
    onSortReset: func.isRequired
  }
}


const DragSourceSpec = {
  beginDrag({ field }) {
    return field
  },

  endDrag({ onSort, onSortReset }, monitor) {
    if (monitor.didDrop()) {
      onSort()
    } else {
      onSortReset()
    }
  }
}

const DragSourceCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  isDragging: monitor.isDragging()
})


const DropTargetSpec = {
  hover({ field, onSortPreview }, monitor, { container }) {
    const type = monitor.getItemType()
    const item = monitor.getItem()

    switch (type) {
      case DND.TEMPLATE.FIELD:
        if (item === field) break

        var { top, height } = bounds(container)
        var offset = round((monitor.getClientOffset().y - top) / height)

        onSortPreview(item, field, offset)
        break
    }
  }
}

const DropTargetCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver()
})


module.exports = {
  TemplateField:
    DragSource(
      DND.TEMPLATE.FIELD, DragSourceSpec, DragSourceCollect)(
        DropTarget(
          DND.TEMPLATE.FIELD,
          DropTargetSpec,
          DropTargetCollect)(TemplateField))
}
