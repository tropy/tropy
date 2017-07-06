'use strict'

const React = require('react')
const { PureComponent } = React
const { DragSource, DropTarget } = require('react-dnd')
const { PropertySelect } = require('../property/select')
const { IconButton } = require('../button')
const { FormField, FormGroup, FormToggle, Label } = require('../form')
const { IconGrip, IconPlusCircle, IconMinusCircle } = require('../icons')
const { DND } = require('../../constants')
const cx = require('classnames')
const { array, bool, func, number, object } = require('prop-types')
const { bounds } = require('../../dom')
const { round } = Math


class TemplateField extends PureComponent {
  get classes() {
    return {
      'template-field': true,
      'dragging': this.props.isDragging
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  handlePropertyChange = () => {
  }

  handleInsert = () => {
    this.props.onInsert(this.props.field, this.props.position + 1)
  }

  handleRemove = () => {
    this.props.onRemove(this.props.field)
  }

  connectDragSource(element) {
    return this.props.isDisabled ? element : this.props.ds(element)
  }

  connectDropTarget(element) {
    return this.props.isDisabled ? element : this.props.ds(element)
  }

  renderInsertButton() {
    if (this.props.isDisabled) return null
    if (this.props.isTransient) return null

    return (
      <IconButton
        icon={<IconPlusCircle/>}
        onClick={this.handleInsert}/>
    )
  }

  renderRemoveButton() {
    if (this.props.isDisabled) return null
    if (this.props.isTransient && this.props.isOnly) return null

    return (
      <IconButton
        icon={<IconMinusCircle/>}
        onClick={this.handleRemove}/>
    )
  }

  render() {
    return this.connectDropTarget(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}>
        {this.connectDragSource(
          <fieldset>
            {!this.props.isDisabled && <IconGrip/>}
            <FormGroup isCompact>
              <Label id="template.field.property"/>
              <div className="col-9">
                <PropertySelect
                  properties={this.props.properties}
                  selected={this.props.field.property}
                  isRequired={false}
                  placeholder="property.select"
                  onChange={this.handlePropertyChange}/>
              </div>
            </FormGroup>
            <FormToggle
              id="template.field.isRequired"
              name="isRequired"
              value={this.props.field.isRequired}
              isDisabled={this.props.isDisabled || this.props.isTransient}
              onChange={this.handlePropertyChange}/>
            <FormField
              id="template.field.hint"
              name="hint"
              value={this.props.field.hint || ''}
              isDisabled={this.props.isDisabled || this.props.isTransient}
              onChange={this.handlePropertyChange}
              isCompact/>
            <FormField
              id="template.field.constant"
              name="constant"
              value={this.props.field.constant || ''}
              isDisabled={this.props.isDisabled || this.props.isTransient}
              onChange={this.handlePropertyChange}
              isCompact/>
          </fieldset>
        )}
        {this.renderInsertButton()}
        {this.renderRemoveButton()}
      </li>
    )
  }

  static propTypes = {
    field: object.isRequired,
    isDragging: bool,
    isDisabled: bool,
    isTransient: bool,
    isOnly: bool,
    position: number.isRequired,
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
    const item = monitor.getItem()
    if (item === field) return

    const { top, height } = bounds(container)
    const offset = round((monitor.getClientOffset().y - top) / height)

    onSortPreview(item, field, offset)
  },

  drop({ field }) {
    return field
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
