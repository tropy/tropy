'use strict'

const React = require('react')
const { Fragment, Component } = React
const { ResourceSelect } = require('../resource/select')
const { Popup } = require('../popup')
const { arrayOf, func, number, object, string } = require('prop-types')
const { OPTION, PANEL } = require('../../constants/sass')
const { IconTick } = require('../icons')
const { min } = Math

class ColumnContextMenu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      height: this.getColumnSelectHeight(props.options.length, props)
    }
  }

  get style() {
    return {
      left: this.props.left,
      height: this.state.height,
      top: this.props.top,
      width: this.props.width
    }
  }

  getColumnSelectHeight(rows, { maxRows } = this.props) {
    return OPTION.HEIGHT * ((min(rows || 1, maxRows)) + 1) +
      OPTION.LIST_MARGIN
  }

  handleResize = ({ rows }) => {
    this.setState({
      height: this.getColumnSelectHeight(rows, this.props)
    })
  }

  render() {
    return (
      <Popup
        autofocus
        className="column-context-menu"
        onClickOutside={this.props.onClose}
        onResize={this.props.onClose}
        style={this.style}>
        <ColumnSelect
          maxRows={this.props.maxRows}
          onClose={this.props.onClose}
          onInsert={this.props.onInsert}
          onRemove={this.props.onRemove}
          onResize={this.handleResize}
          options={this.props.options}
          value={this.props.value}/>
      </Popup>
    )
  }

  static propTypes = {
    left: number.isRequired,
    maxRows: number.isRequired,
    onClose: func.isRequired,
    onInsert: func.isRequired,
    onRemove: func.isRequired,
    options: arrayOf(object).isRequired,
    top: number.isRequired,
    value: arrayOf(string).isRequired,
    width: number
  }

  static defaultProps = {
    maxRows: 10,
    width: PANEL.MIN_WIDTH
  }
}

const ColumnSelect = (props) => (
  <ResourceSelect
    canClearByBackspace={false}
    className="column-select"
    placeholder="select.column.placeholder"
    hideClearButton
    isRequired
    isStatic
    isValueHidden
    toText={Column}
    {...props}/>
)

const Column = (col, isSelected) => (
  <Fragment>
    {isSelected && <IconTick/>}
    <span className="truncate">{col.label}</span>
    <span className="mute truncate">
      {col.prefix ? `${col.prefix}:${col.name}` : col.id}
    </span>
  </Fragment>
)

module.exports = {
  ColumnContextMenu,
  ColumnSelect
}
