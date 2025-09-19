import React from 'react'
import { Scroll } from './scroll/scroll.js'
import { SASS } from '../constants/index.js'
import { blank } from '../common/util.js'
import cx from 'classnames'

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
    return this.scroll.current.select(this.scroll.current.next(...args))
  }

  prev(...args) {
    return this.scroll.current.select(this.scroll.current.prev(...args))
  }

  first() {
    return this.scroll.current.select(this.scroll.current.first())
  }

  last() {
    return this.scroll.current.select(this.scroll.current.last())
  }

  pageUp() {
    return this.scroll.current.select(this.scroll.current.pageUp())
  }

  pageDown() {
    return this.scroll.current.select(this.scroll.current.pageDown())
  }

  render() {
    return (
      <div className="option-list">
        <Scroll
          ref={this.scroll}
          cursor={this.props.active}
          restrict={this.props.restrict}
          onSelect={this.props.onActivate}
          items={this.props.values}
          itemHeight={this.props.rowHeight}>
          {(option) => (
            <Option
              key={option.id}
              isActive={this.isActive(option)}
              isSelected={this.isSelected(option)}
              onClick={this.props.onSelect}
              onHover={this.handleHover}
              option={option}/>
          )}
        </Scroll>
      </div>
    )
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
