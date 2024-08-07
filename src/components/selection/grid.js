import React from 'react'
import { SelectionIterator } from './iterator.js'
import { SelectionTile } from './tile.js'
import cx from 'classnames'
import { match } from '../../keymap.js'
import { on, off } from '../../dom.js'
import { indexOf, sanitize } from '../../common/collection.js'
import { TABS } from '../../constants/index.js'


class SelectionGrid extends SelectionIterator {
  container = React.createRef()

  componentDidMount() {
    on(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  get style() {
    const { cols } = this.props

    return {
      gridTemplateColumns: `repeat(${cols}, ${cols}fr)`
    }
  }

  get current() {
    return this.next(0)
  }

  next(offset = 1) {
    let { active, selections } = this.props

    if (active != null)
      return selections[sanitize(
        selections.length,
        indexOf(selections, active) + offset,
        'bounds')]
    else
      return this.first()
  }

  prev(offset = 1) {
    if (this.props.active != null)
      return this.next(-offset)
    else
      return this.last()
  }

  first() {
    return this.props.selections[0]
  }

  last() {
    return this.props.selections[this.props.selections.length - 1]
  }

  delete(selection) {
    if (selection != null) {
      this.props.onDelete({
        id: this.props.photo.id,
        selection: selection.id
      })
    }
  }

  handleTabFocus = () => {
    this.props.onTabFocus()
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'left':
        this.select(this.prev())
        break
      case 'right':
        this.select(this.next())
        break
      case 'up':
        this.select(this.prev(this.props.cols))
        break
      case 'down':
        this.select(this.next(this.props.cols))
        break
      case 'first':
        this.select(this.first())
        break
      case 'last':
        this.select(this.last())
        break
      case 'open':
        this.open(this.current)
        break
      case 'delete':
        this.delete(this.current)
        this.select(this.next() || this.prev())
        break
      case 'rotateLeft':
        this.props.onRotate(-90)
        break
      case 'rotateRight':
        this.props.onRotate(90)
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }


  render() {
    return this.connect(
      <ul
        ref={this.container}
        className={cx('selection-grid', { over: this.props.isOver })}
        style={this.style}
        tabIndex={TABS.SelectionGrid}
        onBlur={this.props.onBlur}
        onKeyDown={this.handleKeyDown}>
        {this.map(({ selection, ...props }) => (
          <SelectionTile
            {...props}
            key={selection.id}
            isSelected={false}
            onContextMenu={this.props.onContextMenu}
            selection={selection}/>
        ))}
      </ul>
    )
  }
}

const SelectionGridContainer = SelectionGrid.asDropTarget()

export {
  SelectionGridContainer as SelectionGrid
}
