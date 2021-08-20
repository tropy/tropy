import React from 'react'
import { SelectionIterator } from './iterator'
import { SelectionTile } from './tile'
import cx from 'classnames'
import { func, number, object } from 'prop-types'
import { match } from '../../keymap'
import { on, off } from '../../dom'
import { indexOf, sanitize } from '../../common/collection'
import { TABS } from '../../constants'


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

  next(offset = 1) {
    let { active, selections } = this.props

    if (active != null)
      return selections[sanitize(
        selections,
        indexOf(selections, active) + offset,
        'wrap')]
    else
      return selections[0]
  }

  prev(offset = 1) {
    if (this.props.active != null)
      return this.next(-offset)
    else
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
        className={cx('selection-grid', { over: this.props.isOver })}
        style={this.style}
        tabIndex={TABS.SelectionGrid}
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
    size: number.isRequired,
    keymap: object.isRequired,
    onBlur: func.isRequired,
    onTabFocus: func.isRequired
  }
}

const SelectionGridContainer = SelectionGrid.asDropTarget()

export {
  SelectionGridContainer as SelectionGrid
}
