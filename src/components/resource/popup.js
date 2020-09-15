import React from 'react'
import { ResourceSelect } from './select'
import { Popup } from '../popup'
import { SASS } from '../../constants'
import { viewport } from '../../dom'
import { arrayOf, func, number, object, oneOfType, string } from 'prop-types'

const { OPTION, PANEL } = SASS


export class PopupSelect extends React.Component {
  constructor(props) {
    super(props)
    this.state = PopupSelect.getInitialStateFromProps(props)
  }

  static getInitialStateFromProps(props) {
    let { left, top, width } = props
    let bounds = viewport()
    let height = PopupSelect.getHeight(props.options.length, props)

    if (left + width > bounds.width && left > width) left -= width
    if (top + height > bounds.height && top > height) top -= height

    return { top, left, height }
  }

  static getHeight(rows, { maxRows }) {
    return OPTION.HEIGHT * ((Math.min(rows || 1, maxRows)) + 1) +
      OPTION.LIST_MARGIN
  }

  handleResize = ({ rows }) => {
    this.setState({
      height: PopupSelect.getHeight(rows, this.props)
    })
  }

  render() {
    let { width, ...props } = this.props
    let { left, top, height } = this.state

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
