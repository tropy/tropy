import React from 'react'
import { WindowContext } from '../window'
import { DND, DropTarget, getDroppedFiles, hasPhotoFiles } from '../dnd'
import { ItemGrid, ItemTable, NoItems } from '../item'
import { ProjectSidebar } from './sidebar'
import { ProjectToolbar } from './toolbar'
import { pick } from '../../common/util'
import { array, bool, func, object, number } from 'prop-types'
import { SASS } from '../../constants'


class ProjectView extends React.Component {
  iterator = React.createRef()

  componentDidUpdate({ isDisabled: wasDisabled }) {
    if (wasDisabled && !this.props.isDisabled) {
      this.iterator.current?.focus()
    }
  }

  get size() {
    return SASS.ITEM.ZOOM[this.props.zoom]
  }

  get isEmpty() {
    return this.props.isEmpty &&
      !this.props.nav.trash &&
      this.props.items.length === 0
  }

  get maxZoom() {
    return SASS.ITEM.ZOOM.length - 1
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
      isDisabled,
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
          isDisabled={isDisabled}/>
        <div className="main">
          <section className="items" style={this.style}>
            <header>
              <ProjectToolbar
                count={items.length}
                isDisabled={isDisabled}
                isReadOnly={isReadOnly}
                maxZoom={maxZoom}
                query={nav.query}
                zoom={zoom}
                onItemCreate={this.handleItemImport}
                onSearch={onSearch}
                onZoomChange={this.handleZoomChange}/>
            </header>
            {isEmpty ?
              <NoItems
                connectDropTarget={this.props.connectDropTarget}
                isOver={isOver && canDrop}
                isReadOnly={isReadOnly}/> :
              <ItemIterator {...pick(this.props, ItemIterator.getPropKeys())}
                ref={this.iterator}
                items={items}
                isDisabled={isDisabled}
                isTrashSelected={nav.trash}
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
                onSort={this.handleSort}/>}
          </section>
        </div>
      </div>
    )
  }

  static contextType = WindowContext

  static propTypes = {
    canDrop: bool,
    edit: object.isRequired,
    isDisabled: bool,
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
    let photos = getDroppedFiles(monitor.getItem())

    if (photos) {
      onItemImport({ ...photos, list: nav.list })
      return photos
    }
  },

  canDrop({ nav, project }, monitor) {
    if (project?.isReadOnly || nav.trash)
      return false

    switch (monitor.getItemType()) {
      case DND.FILE:
        return hasPhotoFiles(monitor.getItem())
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

const ProjectViewContainer =
  DropTarget([DND.FILE, DND.URL], spec, collect)(ProjectView)

export {
  ProjectViewContainer as ProjectView
}
