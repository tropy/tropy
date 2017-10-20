'use strict'

const React = require('react')
const { SelectionIterator } = require('./iterator')
const { SelectionTile } = require('./tile')
const cx = require('classnames')
const { func, number, object } = require('prop-types')
const { match } = require('../../keymap')
const { on, off } = require('../../dom')


class SelectionGrid extends SelectionIterator {
  componentDidMount() {
    on(this.container, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleTabFocus)
  }

  get isGrid() { return true }

  get classes() {
    return [super.classes, 'grid']
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
        this.select(this.prev(this.state.cols))
        break
      case (this.isVertical ? 'right' : 'down'):
        this.select(this.next(this.state.cols))
        break
      case 'home':
        this.scroll(0)
        break
      case 'end':
        this.scrollToEnd()
        break
      case 'pageUp':
        this.scrollPageUp()
        break
      case 'pageDown':
        this.scrollPageDown()
        break
      case 'open':
        this.open(this.current())
        break
      case 'delete':
        this.delete(this.current())
        this.select(this.next() || this.prev())
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
        ref={this.setContainer}
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

module.exports = {
  SelectionGrid: SelectionGrid.asDropTarget()
}
