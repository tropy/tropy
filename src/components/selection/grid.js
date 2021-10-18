import React from 'react'
import { SelectionIterator } from './iterator'
import { SelectionTile } from './tile'
import cx from 'classnames'
import { func, number, object } from 'prop-types'
import { match } from '../../keymap'
import { on, off } from '../../dom'


class SelectionGrid extends SelectionIterator {
  componentDidMount() {
    on(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  get isGrid() { return true }

  get isVertical() {
    return this.props.cols === 1
  }

  get classes() {
    return [super.classes, 'selection-grid']
  }

  get style() {
    const { cols } = this.props

    return {
      gridTemplateColumns: `repeat(${cols}, ${cols}fr)`
    }
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

  // eslint-disable-next-line complexity
  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case (this.isVertical ? 'up' : 'left'):
        this.select(this.prev())
        break
      case (this.isVertical ? 'down' : 'right'):
        this.select(this.next())
        break
      case (this.isVertical ? 'left' : 'up'):
        this.select(this.prev(this.props.cols))
        break
      case (this.isVertical ? 'right' : 'down'):
        this.select(this.next(this.props.cols))
        break
      case 'home':
        this.handleHomeKey(event)
        break
      case 'end':
        this.handleEndKey(event)
        break
      case 'pageUp':
        this.handlePageUp(event)
        break
      case 'pageDown':
        this.handlePageDown(event)
        break
      case 'open':
        this.open(this.current())
        break
      case 'delete':
        this.delete(this.current())
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
        className={cx(this.classes)}
        style={this.style}
        tabIndex={this.tabIndex}
        onBlur={this.props.onBlur}
        onKeyDown={this.handleKeyDown}>
        {this.map(({ selection, ...props }) =>
          <SelectionTile {...props}
            key={selection.id}
            isSelected={false}
            onContextMenu={this.props.onContextMenu}
            selection={selection}/>)}
      </ul>
    )
  }

  static propTypes = {
    ...SelectionIterator.propTypes,
    cols: number.isRequired,
    keymap: object.isRequired,
    onBlur: func.isRequired,
    onTabFocus: func.isRequired
  }
}

const SelectionGridContainer = SelectionGrid.asDropTarget()

export {
  SelectionGridContainer as SelectionGrid
}
