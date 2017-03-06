'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { BufferedResizable } = require('../resizable')
const { ItemGrid, ItemTable } = require('../item')
const { ProjectSidebar } = require('./sidebar')
const { ProjectToolbar } = require('./toolbar')
const { isValidImage } = require('../../image')
const { pick, } = require('../../common/util')
const { array, bool, func, object, number } = PropTypes
const { ITEM, SIDEBAR } = require('../../constants/sass')


class ProjectView extends PureComponent {
  get size() {
    return ITEM.ZOOM[this.props.zoom]
  }

  get maxZoom() {
    return ITEM.ZOOM.length - 1
  }

  get ItemIterator() {
    return this.props.zoom ? ItemGrid : ItemTable
  }

  get style() {
    return {
      flexBasis: `calc(100% - ${this.props.offset}px)`
    }
  }

  handleSidebarResize = (width) => {
    this.props.onUiUpdate({ sidebar: { width: Math.round(width) } })
  }

  handleZoomChange = (zoom) => {
    this.props.onUiUpdate({ zoom })
  }

  render() {
    const {
      canDrop,
      edit,
      isOver,
      items,
      nav,
      sidebar,
      zoom,
      onItemCreate,
      onItemSelect,
      ...props
    } = this.props

    const { size, maxZoom, ItemIterator } = this

    return (
      <div id="project-view">
        <BufferedResizable
          edge="right"
          value={sidebar.width}
          min={SIDEBAR.MIN_WIDTH}
          max={SIDEBAR.MAX_WIDTH}
          onChange={this.handleSidebarResize}>
          <ProjectSidebar {...pick(props, ProjectSidebar.props)}
            edit={edit}
            selectedList={nav.list}
            selectedTags={nav.tags}
            isSelected={!(nav.list || nav.trash)}
            isTrashSelected={nav.trash}/>
        </BufferedResizable>
        <main>
          <section id="items" style={this.style}>
            <header>
              <ProjectToolbar
                zoom={zoom}
                maxZoom={maxZoom}
                isDisabled={!items.length}
                onItemCreate={onItemCreate}
                onDoubleClick={ARGS.frameless ? props.onMaximize : null}
                onZoomChange={this.handleZoomChange}/>
            </header>

            <ItemIterator {...pick(props, ItemIterator.props)}
              items={items}
              edit={edit.column}
              list={nav.list}
              selection={nav.items}
              size={size}
              isDisabled={nav.trash}
              isOver={isOver && canDrop}
              onCreate={onItemCreate}
              onSelect={onItemSelect}/>
          </section>
        </main>
      </div>
    )
  }

  static propTypes = {
    canDrop: bool,
    edit: object.isRequired,
    isOver: bool,
    items: array.isRequired,
    nav: object.isRequired,
    offset: number.isRequired,
    sidebar: object.isRequired,
    dt: func.isRequired,
    zoom: number.isRequired,
    onItemCreate: func.isRequired,
    onItemImport: func.isRequired,
    onItemSelect: func.isRequired,
    onMaximize: func.isRequired,
    onUiUpdate: func.isRequired
  }
}

const spec = {
  drop({ nav, onItemImport }, monitor) {
    const files = monitor
      .getItem()
      .files
      .filter(isValidImage)
      .map(file => file.path)

    return onItemImport({ files, list: nav.list })
  },

  canDrop(_, monitor) {
    return !!monitor.getItem().files.find(isValidImage)
  }
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
})

module.exports = {
  ProjectView: DropTarget(NativeTypes.FILE, spec, collect)(ProjectView)
}
