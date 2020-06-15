'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { DragSource, DropTarget, getEmptyImage, DND } = require('../dnd')
const { FormattedMessage } = require('react-intl')
const { blank, noop, pluck, URI } = require('../../common/util')
const { IconLock, IconWarningSm } = require('../icons')
const cx = require('classnames')
const { TYPE } = require('../../constants')
const { getMetadataCompletions } = require('../../selectors')
const { auto } = require('../../format')
const {
  arrayOf, bool, func, number, shape, string, oneOfType, object
} = require('prop-types')
const { ResourceSelect } = require('../resource/select')


const NewMetadataField = ({ options, value, onCreate, onCancel }) => (
  <li>
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
      onClose={({ type } = {}) => type === 'escape' && onCancel()}
      onBlur={onCancel}
      onInsert={onCreate}/>
  </li>
)

NewMetadataField.propTypes = {
  options: arrayOf(object).isRequired,
  value: arrayOf(string),
  onCancel: func,
  onCreate: func.isRequired
}

class MetadataField extends React.PureComponent {
  get classes() {
    return ['metadata-field', this.props.type, {
      extra: this.props.isExtra,
      mixed: this.props.isMixed
    }]
  }

  get isInvalid() {
    return this.props.isRequired && blank(this.props.text)
  }

  get label() {
    return this.props.label ||
      this.props.property.label ||
      URI.getLabel(this.props.property.id)
  }

  get property() {
    return this.props.property.id
  }

  get details() {
    return pluck(this.props.property, ['id', 'description', 'comment'])
  }

  get isDraggable() {
    return !blank(this.props.text)
  }

  handleClick = () => {
    if (!this.props.isDisabled && !this.props.isReadOnly) {
      this.props.onEdit(this.property)
    }
  }

  handleChange = (text, hasChanged = true, hasBeenForced) => {
    this.props.onChange({
      [this.property]: { text, type: this.props.type }
    }, hasChanged, hasBeenForced)
  }

  handleCancel = (hasChanged, hasBeenForced) => {
    if (hasBeenForced) this.props.onEditCancel()
    else this.handleChange(this.props.text, hasChanged)
  }

  handleContextMenu = (event) => {
    if (!this.props.isDisabled && !this.props.isReadOnly) {
      this.props.onContextMenu(event, {
        isExtra: this.props.isExtra,
        property: this.property
      })
    }
  }

  handleKeyDown = (event, input) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()

      if (input.hasChanged) input.commit(true)

      if (event.shiftKey) this.props.onPrev()
      else this.props.onNext()
    }
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage())
  }

  connect(element) {
    if (!this.props.isDisabled && this.isDraggable)
      element = this.props.connectDragSource(element)

    if (!this.props.isDisabled && !this.props.isReadOnly)
      element = this.props.connectDropTarget(element)

    return element
  }

  render() {
    let { classes, details, label, isInvalid } = this

    return (
      <li
        className={cx(classes)}
        onContextMenu={this.handleContextMenu}>
        <label title={details.join('\n\n')}>{label}</label>
        {this.connect(
          <div
            className={cx('value', { over: this.props.isOver })}
            onClick={this.handleClick}>
            <Editable
              value={this.props.text}
              getCompletions={getMetadataCompletions}
              display={auto(this.props.text, this.props.type)}
              placeholder={this.props.placeholder}
              isActive={this.props.isEditing}
              isRequired={this.props.isRequired}
              onCancel={this.handleCancel}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}/>
            {isInvalid && <IconWarningSm/>}
            {this.props.isReadOnly && <IconLock/>}
          </div>)}
      </li>
    )
  }

  static propTypes = {
    id: arrayOf(number),
    isEditing: bool,
    isDisabled: bool,
    isExtra: bool.isRequired,
    isMixed: bool,
    isRequired: bool,
    isReadOnly: bool,
    isOver: bool,

    property: shape({
      id: string.isRequired,
      label: string,
      type: string,
      description: string,
      comment: string
    }).isRequired,

    label: string,
    placeholder: string,
    text: string,
    type: string.isRequired,

    connectDragSource: func.isRequired,
    connectDragPreview: func.isRequired,
    connectDropTarget: func.isRequired,

    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onChange: func.isRequired,
    onContextMenu: func.isRequired,
    onCopy: func.isRequired,
    onNext: func.isRequired,
    onPrev: func.isRequired
  }

  static defaultProps = {
    type: TYPE.TEXT,
    onContextMenu: noop
  }
}


const Field = ({ isStatic, hint, label, onClick, ...props }) =>
  (props.value == null) ? null : (
    <li className={cx('metadata-field', {
      static: isStatic,
      clickable: onClick != null
    })}>
      <label>
        <FormattedMessage id={label}/>
      </label>
      <div
        className="value"
        onClick={onClick}
        title={hint}>
        {isStatic ?
          <div className="truncate">{props.display || props.value}</div> :
          <Editable {...props} />}
      </div>
    </li>
  )

Field.propTypes = {
  display: string,
  hint: string,
  isEditing: bool,
  isStatic: bool,
  label: string.isRequired,
  value: oneOfType([string, number]).isRequired,
  onChange: func,
  onClick: func
}

const StaticField = React.memo((props) =>
  <Field {...props} isStatic/>
)


const DragSourceSpec = {
  beginDrag({ id, isMixed, property, text, type }) {
    return {
      id,
      isMixed,
      property: property.id,
      value: auto(text, type),
      position: 'relative'
    }
  },

  endDrag({ onCopy }, monitor) {
    if (monitor.didDrop()) {
      let item = monitor.getItem()
      let drop = monitor.getDropResult()

      onCopy({
        id: item.id,
        from: item.property,
        to: drop.property
      }, { cut: drop.dropEffect === 'move' })
    }
  }
}

const DragSourceCollect = (connect) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview()
})

const DropTargetSpec = {
  canDrop({ id, property }, monitor) {
    let item = monitor.getItem()

    switch (monitor.getItemType()) {
      case DND.TEXT:
      case DND.URL:
        return true
      case DND.FIELD:
        return id === item.id && property.id !== item.property
      default:
        return false
    }
  },

  drop({ onChange, property, type }, monitor) {
    let droptype = monitor.getItemType()
    let item = monitor.getItem()

    switch (droptype) {
      case DND.TEXT:
      case DND.URL:
        onChange({
          [property.id]: {
            text: item.text || item.urls[0],
            type
          }
        }, true)
        break
      case DND.FIELD:
        return { property: property.id }
    }

  }
}

const DropTargetCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.canDrop() && monitor.isOver()
})


module.exports.Field = Field
module.exports.StaticField = StaticField
module.exports.NewMetadataField = NewMetadataField

module.exports.MetadataField = DragSource(
  DND.FIELD, DragSourceSpec, DragSourceCollect
)(DropTarget(
  [DND.FIELD, DND.TEXT, DND.URL],
  DropTargetSpec,
  DropTargetCollect
)(MetadataField))
