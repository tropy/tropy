'use strict'

const React = require('react')
const { WindowContext } = require('../main')
const { DND, DropTarget, hasPhotoFiles } = require('../dnd')
const { ItemGrid, ItemTable } = require('../item')
const { ProjectSidebar } = require('./sidebar')
const { ProjectToolbar } = require('./toolbar')
const { blank, pick } = require('../../common/util')
const { array, bool, func, object, number } = require('prop-types')
const { ITEM } = require('../../constants/sass')


class ProjectView extends React.Component {
  get size() {
    return ITEM.ZOOM[this.props.zoom]
  }

  get isEmpty() {
    return this.props.isEmpty &&
      !this.props.nav.trash &&
      this.props.items.length === 0
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

  handleZoomChange = (zoom) => {
    this.props.onUiUpdate({ zoom })
  }

  handleItemImport = () => {
    return this.props.onItemImport({ list: this.props.nav.list })
  }

  handleSort = (sort) => {
    this.props.onSort({
      ...sort, list: this.props.nav.list || 0
    })
  }

  render() {
    let {
      isActive,
      canDrop,
      edit,
      isOver,
      items,
      keymap,
      nav,
      photos,
      tags,
      zoom,
      onItemCreate,
      onItemSelect,
      onSearch
    } = this.props

    let { size, maxZoom, ItemIterator, isEmpty } = this
    let isReadOnly = this.props.project?.isReadOnly || nav.trash

    return (
      <div id="project-view">
        <ProjectSidebar {...pick(this.props, ProjectSidebar.props)}
          isDisabled={!isActive}/>
        <div className="main">
          <section className="items" style={this.style}>
            <header>
              <ProjectToolbar
                count={items.length}
                isDisabled={!isActive}
                isReadOnly={isReadOnly}
                maxZoom={maxZoom}
                query={nav.query}
                zoom={zoom}
                onItemCreate={this.handleItemImport}
                onSearch={onSearch}
                onZoomChange={this.handleZoomChange}/>
            </header>
            <ItemIterator {...pick(this.props, ItemIterator.getPropKeys())}
              items={items}
              isDisabled={!isActive}
              isTrashSelected={nav.trash}
              isEmpty={isEmpty}
              isReadOnly={isReadOnly}
              photos={photos}
              edit={edit.column}
              keymap={keymap.ItemIterator}
              list={nav.list}
              selection={nav.items}
              size={size}
              tags={tags}
              hasScrollbars={this.context.state.scrollbars}
              isOver={isOver && canDrop}
              onCreate={onItemCreate}
              onSelect={onItemSelect}
              onSort={this.handleSort}/>
            <div className="fake-gap"/>
          </section>
        </div>
      </div>
    )
  }

  static contextType = WindowContext

  static propTypes = {
    canDrop: bool,
    edit: object.isRequired,
    isActive: bool,
    isEmpty: bool.isRequired,
    isOver: bool,
    items: array.isRequired,
    keymap: object.isRequired,
    nav: object.isRequired,
    offset: number.isRequired,
    photos: object.isRequired,
    project: object,
    tags: object.isRequired,
    connectDropTarget: func.isRequired,
    zoom: number.isRequired,
    onItemCreate: func.isRequired,
    onItemImport: func.isRequired,
    onItemSelect: func.isRequired,
    onItemTagAdd: func.isRequired,
    onSearch: func.isRequired,
    onSort: func.isRequired,
    onUiUpdate: func.isRequired
  }
}

const spec = {
  drop({ nav, onItemImport }, monitor) {
    let item = monitor.getItem()
    let files, urls

    switch (monitor.getItemType()) {
      case DND.FILE:
        files = item.files.map(f => f.path)
        break
      case DND.URL:
        urls = item.urls
        break
    }

    if (!blank(files) || !blank(urls)) {
      onItemImport({ files, urls, list: nav.list })
      return { files, urls }
    }
  },

  canDrop({ nav, project }, monitor) {
    if (project?.isReadOnly || nav.trash)
      return false

    switch (monitor.getItemType()) {
      case DND.FILE:
        return hasPhotoFiles(monitor)
      default:
        return true
    }
  }
}

const collect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
})

module.exports = {
  ProjectView: DropTarget([
    DND.FILE,
    DND.URL
  ], spec, collect)(ProjectView)
}
