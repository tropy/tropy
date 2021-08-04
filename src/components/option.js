import React from 'react'
import { Iterator } from './iterator'
import { Scroll } from './scroll'
import { SASS } from '../constants'
import { blank } from '../common/util'
import cx from 'classnames'
import { arrayOf, bool, func, node, number, shape, string } from 'prop-types'


export class Option extends React.PureComponent {
  get classes() {
    return ['option', {
      active: this.props.isActive,
      selected: this.props.isSelected
    }]
  }

  handleMouseDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.button === 0) {
      this.props.onClick(this.props.option)
    }
  }

  handleMouseMove = (event) => {
    this.props.onHover(event, this.props.isActive, this.props.option)
  }

  render() {
    return (
      <li
        className={cx(this.classes)}
        onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown}>
        {this.props.option.text}
      </li>
    )
  }

  static propTypes = {
    isActive: bool,
    isSelected: bool,
    onClick: func.isRequired,
    onHover: func.isRequired,
    option: shape({
      id: string.isRequired,
      text: node.isRequired
    }).isRequired
  }
}


export class OptionList extends Iterator {
  getIterables(props = this.props) {
    return props.values
  }

  hasMoved({ clientX, clientY }) {
    try {
      return (clientX !== this.lastX || clientY !== this.lastY)
    } finally {
      this.lastX = clientX
      this.lastY = clientY
    }
  }

  head() {
    return this.props.active
  }

  isActive({ id }) {
    return id === this.props.active && !blank(id)
  }

  isSelected({ id }) {
    return this.props.selection.includes(id)
  }

  handleFocus = false

  handleHover = (event, isActive, option) => {
    if (this.hasMoved(event) && !isActive) {
      this.props.onActivate(option)
    }
  }

  render() {
    return (
      <div className="option-list">
        <Scroll
          ref={this.container}
          items={this.props.values}
          itemHeight={this.props.rowHeight}>
          {(option) =>
            <Option
              key={option.id}
              isActive={this.isActive(option)}
              isSelected={this.isSelected(option)}
              onClick={this.props.onSelect}
              onHover={this.handleHover}
              option={option}/>}
        </Scroll>
      </div>
    )
  }

  static propTypes = {
    active: string,
    onActivate: func.isRequired,
    onSelect: func.isRequired,
    rowHeight: number.isRequired,
    selection: arrayOf(string).isRequired,
    values: arrayOf(shape({
      id: string.isRequired,
      text: node.isRequired
    })).isRequired
  }

  static defaultProps = {
    ...Iterator.defaultProps,
    rowHeight: SASS.OPTION.HEIGHT,
    selection: []
  }

  static getHeight(rows, {
    maxRows = rows,
    rowHeight = SASS.OPTION.HEIGHT
  } = {}) {
    return (rows) ?
      Math.min(rows, maxRows) * rowHeight + SASS.OPTION.LIST_MARGIN :
      0
  }
}
