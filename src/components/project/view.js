'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Resizable } = require('../resizable')
const { ItemGrid, ItemTable } = require('../item')
const { ProjectSidebar } = require('./sidebar')
const { ProjectToolbar } = require('./toolbar')
const { func, object } = PropTypes


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
    nav: object.isRequired,
    ui: object.isRequired,
    onItemCreate: func.isRequired,
    onItemSelect: func.isRequired,
    onMaximize: func.isRequired,
    onItemZoomChange: func.isRequired
  }
}


module.exports = {
  ProjectView
}
