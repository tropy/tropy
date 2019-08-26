'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { DragSource, DropTarget } = require('react-dnd')
const { FormattedMessage } = require('react-intl')
const { blank, noop, pluck, URI } = require('../../common/util')
const { IconLock, IconWarningSm } = require('../icons')
const cx = require('classnames')
const { TYPE, DND } = require('../../constants')
const { getMetadataCompletions } = require('../../selectors')
const { auto } = require('../../format')
const { getEmptyImage } = require('react-dnd-electron-backend')
const { bool, func, number, oneOfType, shape, string } = require('prop-types')



class MetadataField extends React.PureComponent {
  get classes() {
    return ['metadata-field', {
      extra: this.props.isExtra,
      mixed: this.props.isMixed,
      [this.props.type]: true
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

  handleClick = () => {
    if (!this.props.isDisabled && !this.props.isReadOnly) {
      this.props.onEdit(this.property)
    }
  }

  handleChange = (text, hasChanged = true) => {
    this.props.onChange({
      [this.property]: { text, type: this.props.type }
    }, hasChanged)
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
    this.props.dp(getEmptyImage())
  }

  connect(element) {
    element = this.props.ds(element)
    element = this.props.dt(element)
    return element
  }

  render() {
    let { classes, details, label, isInvalid } = this

    return this.connect(
      <li
        className={cx(classes)}
        onContextMenu={this.handleContextMenu}>
        <label title={details.join('\n\n')}>{label}</label>
        <div className="value" onClick={this.handleClick}>
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
        </div>
      </li>
    )
  }

  static propTypes = {
    isEditing: bool,
    isDisabled: bool,
    isDragging: bool,
    isExtra: bool.isRequired,
    isMixed: bool,
    isRequired: bool,
    isReadOnly: bool,

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

    itemsSelected: number,
    ds: func.isRequired,
    dp: func.isRequired,
    dt: func.isRequired,

    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onChange: func.isRequired,
    onContextMenu: func,
    onNext: func.isRequired,
    onPrev: func.isRequired
  }

  static defaultProps = {
    type: TYPE.TEXT,
    onContextMenu: noop
  }
}


class StaticField extends React.PureComponent {
  get classes() {
    return ['metadata-field', 'static', {
      clickable: this.props.onClick != null
    }]
  }

  render() {
    return (this.props.value == null) ? null : (
      <li className={cx(this.classes)}>
        <label>
          <FormattedMessage id={this.props.label}/>
        </label>
        <div
          className="value"
          onClick={this.props.onClick}
          title={this.props.hint}>
          <div className="static">{this.props.value}</div>
        </div>
      </li>
    )
  }

  static propTypes = {
    hint: string,
    label: string.isRequired,
    value: oneOfType([string, number]).isRequired,
    onClick: func
  }
}




const DragSourceSpec = {
  beginDrag({ property, isMixed, itemsSelected, text  }) {
    return {
      ...property,
      isMixed,
      itemsSelected,
      text
    }
  }


}

const DragSourceCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  dp: connect.dragPreview(),
  isDragging: monitor.isDragging()
})

const DropTargetSpec = {
  // hover({ property }, monitor, component) {
  //   let offset = null
  //   component.setState({ offset })
  // },

  drop({ property }, monitor, component) {
    console.log('!!! DROP', property)
  }
}

const DropTargetCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
})



module.exports.StaticField = StaticField

module.exports.MetadataField = DragSource(
      DND.FIELD, DragSourceSpec, DragSourceCollect
    )(DropTarget(
      DND.FIELD, DropTargetSpec, DropTargetCollect
    )(MetadataField))
