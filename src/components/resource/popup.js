'use strict'

const React = require('react')
const { ResourceSelect } = require('./select')
const { Popup } = require('../popup')
const { OPTION, PANEL } = require('../../constants/sass')
const { min } = Math
const {
  arrayOf, func, number, object, oneOfType, string
} = require('prop-types')


class PopupSelect extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      height: this.getSelectHeight(props.options.length, props)
    }
  }

  getSelectHeight(rows, { maxRows } = this.props) {
    return OPTION.HEIGHT * ((min(rows || 1, maxRows)) + 1) + OPTION.LIST_MARGIN
  }

  handleResize = ({ rows }) => {
    this.setState({
      height: this.getSelectHeight(rows, this.props)
    })
  }

  render() {
    let { left, top, width, ...props } = this.props
    let { height } = this.state

    return (
      <Popup
        autofocus
        className="popup-select"
        onClickOutside={this.props.onClose}
        onResize={this.props.onClose}
        style={{ left, top, width, height }}>
        <ResourceSelect {...props}
          canClearByBackspace={false}
          hideClearButton
          isRequired
          isStatic
          isValueHidden
          onResize={this.handleResize}/>
      </Popup>
    )
  }

  static propTypes = {
    left: number.isRequired,
    maxRows: number.isRequired,
    onClose: func,
    onInsert: func,
    onRemove: func,
    options: arrayOf(object).isRequired,
    top: number.isRequired,
    value: oneOfType([string, arrayOf(string)]),
    width: number
  }

  static defaultProps = {
    maxRows: 10,
    width: PANEL.MIN_WIDTH
  }
}

module.exports = {
  PopupSelect
}
