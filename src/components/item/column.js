'use strict'

const React = require('react')
const { Fragment, Component } = React
const { ResourceSelect } = require('../resource/select')
const { Popup } = require('../popup')
const { OptionList } = require('../option')
const { arrayOf, func, number, object, string } = require('prop-types')
const { INPUT, PANEL } = require('../../constants/sass')

class ColumnContextMenu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      height: getColumnSelectHeight(props.options.length, props)
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

  handleResize = ({ rows }) => {
    this.setState({
      height: getColumnSelectHeight(rows, this.props)
    })
  }

  render() {
    return (
      <Popup
        autofocus
        className="column-context-menu"
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
    height: number.isRequired,
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
    height: OptionList.getHeight(13),
    maxRows: 10,
    width: PANEL.MIN_WIDTH
  }
}

function getColumnSelectHeight(rows, { maxRows }) {
  return INPUT.FOCUS_SHADOW_WIDTH * 2 +
    OptionList.getHeight(1) +
    OptionList.getHeight((rows || 1), { maxRows })
}


const ColumnSelect = (props) => (
  <ResourceSelect
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
    {isSelected && <span>x</span>}
    <span>{col.label}</span>
    <span className="mute">
      {col.prefix ? `${col.prefix}:${col.name}` : col.id}
    </span>
  </Fragment>
)

module.exports = {
  ColumnContextMenu,
  ColumnSelect
}
