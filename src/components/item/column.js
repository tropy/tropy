'use strict'

const React = require('react')
const { Component } = React
const { ResourceSelect } = require('../resource/select')
const { Popup } = require('../popup')
const { OptionList } = require('../option')
const { arrayOf, func, number, object, shape } = require('prop-types')
const { PANEL } = require('../../constants/sass')

class ColumnContextMenu extends Component {
  get style() {
    return {
      left: this.props.left,
      height: this.props.height,
      top: this.props.top,
      width: this.props.width
    }
  }

  handleResize = () => {
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
          options={this.props.columns.available}
          value={this.props.columns.active.map(col => col.id)}/>
      </Popup>
    )
  }

  static propTypes = {
    columns: shape({
      active: arrayOf(object).isRequired,
      available: arrayOf(object).isRequired
    }).isRequired,
    height: number.isRequired,
    left: number.isRequired,
    maxRows: number.isRequired,
    onClose: func.isRequired,
    onInsert: func.isRequired,
    onRemove: func.isRequired,
    top: number.isRequired,
    width: number
  }

  static defaultProps = {
    height: OptionList.getHeight(13),
    maxRows: 12,
    width: PANEL.MIN_WIDTH
  }
}

const ColumnSelect = (props) => (
  <ResourceSelect
    className="column-select"
    placeholder="select.column.placeholder"
    hideClearButton
    isRequired
    isStatic
    isValueHidden
    {...props}/>
)

module.exports = {
  ColumnContextMenu,
  ColumnSelect
}
