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
const { bool, func, object } = PropTypes


class ProjectView extends PureComponent {

  get zoom() {
    return this.props.nav.itemsZoom
  }

  get selection() {
    return this.props.nav.items
  }

  get editing() {
    return this.props.ui.edit
  }

  render() {
    const {
      dt,
      isOver,
      canDrop,
      onItemCreate,
      onItemSelect,
      onItemZoomChange,
      ...props
    } = this.props

    const { zoom, selection, editing } = this
    const ItemIterator = zoom ? ItemGrid : ItemTable

    return (
      <div id="project-view">
        <Resizable edge="right" value={250}>
          <ProjectSidebar {...props}/>
        </Resizable>
        <main>
          <section id="items">
            <header>
              <ProjectToolbar
                zoom={zoom}
                onItemCreate={onItemCreate}
                onMaximize={props.onMaximize}
                onZoomChange={onItemZoomChange}/>
            </header>

            <ItemIterator {...props}
              dt={dt}
              isOver={isOver && canDrop}
              isDisabled={this.props.nav.trash}
              editing={editing}
              selection={selection}
              zoom={zoom}
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
