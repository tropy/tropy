import React, { useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { bool, func, object, number } from 'prop-types'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useActions } from '../../hooks/use-action.js'
import { useEvent } from '../../hooks/use-event.js'
import { usePasteEvent } from '../../hooks/use-paste-event.js'
import { useWindow } from '../../hooks/use-window.js'

import { ItemGrid, ItemTable, NoItems } from '../item/index.js'
import { ProjectSidebar } from './sidebar.js'
import { ProjectToolbar } from './toolbar.js'
import { SASS } from '../../constants/index.js'

import * as act from '../../actions/index.js'

import {
  getAllColumns,
  getSortColumn,
  getVisibleItems
} from '../../selectors/index.js'


export const ProjectView = ({
  isDisabled,
  offset,
  onContextMenu,
  project
}) => {

  let win = useWindow()
  let dispatch = useDispatch()

  let nav = useSelector(state => state.nav)
  let zoom = useSelector(state => state.ui.zoom)
  let items = useSelector(getVisibleItems)
  let sort = useSelector(getSortColumn)

  let iterator = useRef()

  useEffect(() => {
    if (!isDisabled) iterator.current?.focus()
  }, [isDisabled])

  let size = SASS.ITEM.ZOOM[zoom]
  let maxZoom = SASS.ITEM.ZOOM.length - 1

  let ItemIterator = zoom ? ItemGrid : ItemTable

  let isBlank = (project.id && !project.lastAccess) && !nav.trash

  let isReadOnly = project.isReadOnly || nav.trash

  let style = useMemo(() => ({
    flexBasis: `calc(100% - ${offset}px)`
  }), [offset])


  let handleZoomChange = useEvent((value) => {
    dispatch(act.ui.update({ zoom: value }))
  })

  let handleItemImport = useEvent(({ files, urls } = {}) => {
    dispatch(act.item.import({
      files,
      urls,
      list: nav.list
    }))
  })

  let handleSort = useEvent((opts) => {
    dispatch(act.nav.sort(opts))
  })

  let handleSearch = useEvent((query) => {
    dispatch(act.nav.search({ query }))
  })

  usePasteEvent('application/json', (data) => {
    handleItemImport({ data })
  })

  let [{ canDrop }, drop] = useDropPhotoFiles({
    onDrop: handleItemImport,
    isReadOnly
  })


  // TODO these don't concern ProjectView and should be moved!
  // ------------------------------------------------------------
  let edit = useSelector(state => state.edit.column)
  let keymap = useSelector(state => state.keymap.ItemIterator)
  let photos = useSelector(state => state.photos)
  let data = useSelector(state => state.metadata)
  let columns = useSelector(getAllColumns)
  let templates = useSelector(state => state.ontology.template)
  let tags = useSelector(state => state.tags)

  let [
    handleEdit,
    handleEditCancel,
    handleColumnInsert,
    handleColumnOrder,
    handleColumnRemove,
    handleColumnResize,
    handleItemExport,
    handleItemDelete,
    handleItemMerge,
    handleItemOpen,
    handleItemPreview,
    handleMetadataSave,
    handlePhotoMove,
    handlePhotoRotate
  ] = useActions([
    'edit.start', 'edit.cancel',
    'nav.column.insert', 'nav.column.order', 'nav.column.remove', 'nav.column.resize',
    'item.export', 'item.delete', 'item.merge', 'item.open', 'item.preview',
    'metadata.save',
    'photo.move', 'photo.rotate'
  ])

  let handleItemSelect = useEvent((payload, mod, meta) => {
    dispatch(act.item.select(payload, { mod, ...meta }))
  })
  // ------------------------------------------------------------


  return (
    <div id="project-view">
      <ProjectSidebar
        isDisabled={isDisabled}
        project={project}
        onContextMenu={onContextMenu}
        onItemDelete={handleItemDelete}
        onItemImport={handleItemImport}/>

      <div className="main">
        <section className="items" style={style}>
          <header>
            <ProjectToolbar
              count={items.length}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              maxZoom={maxZoom}
              query={nav.query}
              zoom={zoom}
              onItemCreate={handleItemImport}
              onSearch={handleSearch}
              onZoomChange={handleZoomChange}/>
          </header>
          {isBlank ?
            <NoItems
              ref={drop}
              isOver={canDrop}
              isReadOnly={isReadOnly}/> :

            <ItemIterator
              ref={iterator}
              hasScrollbars={win.state.scrollbars}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              items={items}
              list={nav.list}
              onItemDelete={handleItemDelete}
              onSelect={handleItemSelect}
              onSort={handleSort}
              selection={nav.items}
              size={size}

              columns={columns}
              connectDropTarget={drop}
              data={data}
              edit={edit}
              isOver={canDrop}
              isTrashSelected={nav.trash}
              keymap={keymap}
              onColumnInsert={handleColumnInsert}
              onColumnOrder={handleColumnOrder}
              onColumnRemove={handleColumnRemove}
              onColumnResize={handleColumnResize}
              onContextMenu={onContextMenu}
              onEdit={handleEdit}
              onEditCancel={handleEditCancel}
              onItemExport={handleItemExport}
              onItemMerge={handleItemMerge}
              onItemOpen={handleItemOpen}
              onItemPreview={handleItemPreview}
              onMetadataSave={handleMetadataSave}
              onPhotoMove={handlePhotoMove}
              onPhotoRotate={handlePhotoRotate}
              photos={photos}
              sort={sort}
              tags={tags}
              templates={templates}/>}
        </section>
      </div>
    </div>
  )
}

ProjectView.propTypes = {
  isDisabled: bool,
  offset: number.isRequired,
  onContextMenu: func,
  onItemOpen: func,
  project: object
}
