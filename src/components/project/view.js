'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { Resizable } = require('../resizable')
const { ItemGrid, ItemTable } = require('../item')
const { ProjectSidebar } = require('./sidebar')
const { ProjectToolbar } = require('./toolbar')
const { isValidImage } = require('../../image')
const { pick, times } = require('../../common/util')
const { array, bool, func, object, number } = PropTypes


class ProjectView extends PureComponent {
  get size() {
    return this.constructor.Zoom[this.props.zoom]
  }

  get maxZoom() {
    return this.constructor.Zoom.length - 1
  }

  get ItemIterator() {
    return this.props.zoom ? ItemGrid : ItemTable
  }

  handleSidebarResize = (width) => {
    this.props.onUiUpdate({ sidebar: { width } })
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
        <Resizable
          edge="right"
          value={sidebar.width}
          min={150}
          max={750}
          onChange={this.handleSidebarResize}>
          <ProjectSidebar {...pick(props, ProjectSidebar.props)}
            edit={edit}
            selectedList={nav.list}
            selectedTags={nav.tags}
            isSelected={!(nav.list || nav.trash)}
            isTrashSelected={nav.trash}/>
        </Resizable>
        <main>
          <section id="items">
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
    sidebar: object.isRequired,
    dt: func.isRequired,
    zoom: number.isRequired,
    onItemCreate: func.isRequired,
    onItemImport: func.isRequired,
    onItemSelect: func.isRequired,
    onMaximize: func.isRequired,
    onUiUpdate: func.isRequired
  }

  static Zoom = [
    44,
    ...times(52, i => i * 4 + 48),
    ...times(32, i => i * 8 + 256),
    512
  ]
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
