import React from 'react'
import { Scroll } from './scroll'
import { SASS } from '../constants'
import { indexOf } from '../common/collection'
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


export class OptionList extends React.Component {
  scroll = React.createRef()

  hasMoved({ clientX, clientY }) {
    try {
      return (clientX !== this.lastX || clientY !== this.lastY)
    } finally {
      this.lastX = clientX
      this.lastY = clientY
    }
  }

  isActive({ id }) {
    return id === this.props.active && !blank(id)
  }

  isSelected({ id }) {
    return this.props.selection.includes(id)
  }

  handleHover = (event, isActive, option) => {
    if (this.hasMoved(event) && !isActive) {
      this.props.onActivate(option)
    }
  }

  next(...args) {
    this.scroll.current.select(this.scroll.current.next(...args))
  }

  prev(...args) {
    this.scroll.current.select(this.scroll.current.prev(...args))
  }

  first() {
    this.scroll.current.select(this.scroll.current.first())
  }

  last() {
    this.scroll.current.select(this.scroll.current.last())
  }

  pageUp() {
    this.scroll.current.select(this.scroll.current.pageUp())
  }

  pageDown() {
    this.scroll.current.select(this.scroll.current.pageDown())
  }

  render() {
    return (
      <div className="option-list">
        <Scroll
          ref={this.scroll}
          cursor={indexOf(this.props.values, this.props.active)}
          restrict={this.props.restrict}
          onSelect={this.props.onActivate}
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
    restrict: string,
    selection: arrayOf(string).isRequired,
    values: arrayOf(shape({
      id: string.isRequired,
      text: node.isRequired
    })).isRequired
  }

  static defaultProps = {
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
