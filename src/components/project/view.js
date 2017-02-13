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
const { pick } = require('../../common/util')
const { bool, func, object } = PropTypes


// eslint-disable-next-line react/prefer-stateless-function
class ProjectView extends PureComponent {

  get zoom() {
    return this.props.nav.itemsZoom
  }

  get ItemIterator() {
    return this.zoom ? ItemGrid : ItemTable
  }

  render() {
    const {
      isOver,
      canDrop,
      nav,
      ui,
      onItemCreate,
      onItemSelect,
      onItemZoomChange,
      ...props
    } = this.props

    const { zoom, ItemIterator } = this

    return (
      <div id="project-view">
        <Resizable edge="right" value={250}>
          <ProjectSidebar {...pick(props, ProjectSidebar.props)}
            edit={ui.edit}
            context={ui.context}
            nav={nav}/>
        </Resizable>
        <main>
          <section id="items">
            <header>
              <ProjectToolbar
                zoom={zoom}
                onItemCreate={onItemCreate}
                onDoubleClick={ARGS.frameless ? props.onMaximize : null}
                onZoomChange={onItemZoomChange}/>
            </header>

            <ItemIterator {...pick(props, ItemIterator.props)}
              edit={ui.edit.column}
              list={nav.list}
              selection={nav.items}
              sort={nav.sort}
              zoom={zoom}
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
    isOver: bool,
    canDrop: bool,
    nav: object.isRequired,
    ui: object.isRequired,
    dt: func.isRequired,
    onItemCreate: func.isRequired,
    onItemImport: func.isRequired,
    onItemSelect: func.isRequired,
    onMaximize: func.isRequired,
    onItemZoomChange: func.isRequired
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
