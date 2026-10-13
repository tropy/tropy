import { useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useAction } from '../../hooks/use-action.js'
import { useEvent } from '../../hooks/use-event.js'
import { usePasteEvent } from '../../hooks/use-paste-event.js'

import { ItemGrid, ItemTable, NoItems } from '../item/index.js'
import { ProjectSidebar } from './sidebar.js'
import { ProjectToolbar } from './toolbar.js'
import { SASS } from '../../constants/index.js'

import * as act from '../../actions/index.js'

import { getVisibleItems } from '../../selectors/index.js'


export const ProjectView = ({
  isDisabled,
  offset,
  onContextMenu,
  project
}) => {

  let dispatch = useDispatch()

  let nav = useSelector(state => state.nav)
  let zoom = useSelector(state => state.ui.zoom)
  let items = useSelector(getVisibleItems)

  let list = typeof nav.list === 'number' && nav.list > 0 ?
    nav.list : null

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

  let handleItemImport = useEvent((data = {}) => {
    dispatch(act.item.import({ list, ...data }))
  })

  let handleSearch = useEvent((query) => {
    dispatch(act.nav.search({ query }))
  })

  usePasteEvent('application/json', (data) => {
    handleItemImport({ data })
  })

  let [{ canDrop }, drop] = useDropPhotoFiles({
    onDrop: handleItemImport,
    isDisabled: isReadOnly
  })

  let handleItemDelete = useAction(dispatch, 'item.delete')

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
          {isBlank ? (
            <NoItems
              ref={drop}
              isOver={canDrop}
              isReadOnly={isReadOnly}/>
          ) : (
            <ItemIterator
              ref={iterator}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              list={list}
              size={size}
              onContextMenu={onContextMenu}
              onItemImport={handleItemImport}/>
          )}
        </section>
      </div>
    </div>
  )
}
