import React from 'react'
import { Scroll } from './scroll/scroll.js'
import { SASS } from '../constants/index.js'
import { blank } from '../common/util.js'
import { Cursor } from '../common/sequence.js'
import cx from 'classnames'

export class Option extends React.PureComponent {
  get classes () {
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

  render () {
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
  state = {}

  get cursor () {
    return new Cursor(this.props.values, this.props.active, {
      ...this.state.layout,
      restrict: this.props.restrict
    })
  }

  move (move) {
    let option = this.cursor.seek(move)
    this.props.onActivate(option)
    return option
  }

  hasMoved ({ clientX, clientY }) {
    try {
      return (clientX !== this.lastX || clientY !== this.lastY)
    } finally {
      this.lastX = clientX
      this.lastY = clientY
    }
  }

  isActive ({ id }) {
    return id === this.props.active && !blank(id)
  }

  isSelected ({ id }) {
    return this.props.selection.includes(id)
  }

  handleHover = (event, isActive, option) => {
    if (this.hasMoved(event) && !isActive) {
      this.props.onActivate(option)
    }
  }

  handleLayoutChange = (layout) => {
    this.setState({ layout })
  }

  next () {
    return this.move('next')
  }

  prev () {
    return this.move('prev')
  }

  first () {
    return this.move('first')
  }

  last () {
    return this.move('last')
  }

  pageUp () {
    return this.move('pageUp')
  }

  pageDown () {
    return this.move('pageDown')
  }

  render () {
    return (
      <div className="option-list">
        <Scroll
          ref={this.scroll}
          cursor={this.cursor}
          itemHeight={this.props.rowHeight}
          onLayoutChange={this.handleLayoutChange}>
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

  static getHeight (rows, {
    maxRows = rows,
    rowHeight = SASS.OPTION.HEIGHT
  } = {}) {
    return (rows) ?
      Math.min(rows, maxRows) * rowHeight + SASS.OPTION.LIST_MARGIN :
      0
  }
}
