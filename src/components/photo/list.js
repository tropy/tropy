import { useDispatch, useSelector } from 'react-redux'
import { Scroll } from '../scroll/index.js'
import { PhotoListItem } from './list-item.js'
import { SelectionListItem } from '../selection/list-item.js'
import { usePhotoIterator } from './use-photo-iterator.js'
import { useEvent } from '../../hooks/use-event.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { SASS, TABS } from '../../constants/index.js'
import { dc } from '../../common/ns.js'
import cx from 'classnames'
import * as act from '../../actions/index.js'


export const PhotoList = (props) => {
  let { isDisabled } = props
  let dispatch = useDispatch()

  let iterator = usePhotoIterator(props)
  let { scroll } = iterator
  let editing = useSelector(state => state.edit.photo)
  let editingSelection = useSelector(state => state.edit.selection)

  // List items are memoized: these handlers are stable.
  // Edits a photo or a selection (it has a photo field).
  let handleEdit = useEvent((el) => {
    if (el == null || isDisabled)
      return

    let { photo, selection } = iterator.resolve(el)

    if (photo == null)
      return
    if (selection == null)
      dispatch(act.edit.start({ photo: photo.id }))
    else
      dispatch(act.edit.start({ selection }))
  })

  let handleEditCancel = useEvent((...args) => {
    dispatch(act.edit.cancel(...args))
    scroll.current.focus()
  })

  let handleChange = useEvent((...args) => {
    dispatch(act.metadata.save(...args))
  })

  let commands = useKeyMap(['PhotoList', 'PhotoIterator'], {
    contract () {
      return iterator.contract(iterator.current())
    },
    expand () {
      return iterator.expand(iterator.current())
    },
    edit () {
      handleEdit(iterator.current())
    },
    enter () {
      handleEdit(iterator.current())
    },
    open () {
      iterator.open(iterator.current())
    },
    preview () {
      iterator.preview(iterator.current())
    },
    rotateLeft () {
      iterator.rotate(-90)
    },
    rotateRight () {
      iterator.rotate(90)
    },
    delete () {
      iterator.remove(iterator.current())
    },
    copyPhoto () {
      iterator.extract(iterator.current(), { target: ':clipboard:' })
    },
    extract () {
      iterator.extract(iterator.current())
    }
  })

  let onKeyDown = useCursorKeys(iterator.cursor, {
    onMove: iterator.move,
    onKeyDown: commands
  })

  return iterator.connect(
    <div className={cx('photo-list', iterator.classes)}>
      <Scroll
        ref={scroll}
        cursor={iterator.cursor}
        itemHeight={SASS.ROW.HEIGHT}
        tabIndex={TABS.PhotoList}
        onKeyDown={onKeyDown}
        onLayoutChange={iterator.onLayoutChange}>
        {(id) => {
          if (iterator.resolve(id).selection != null) {
            let props = iterator.getSelectionProps(id)

            return props && (
              <SelectionListItem
                {...props}
                key={id}
                title={dc.title}
                isEditing={editingSelection === id}
                onChange={handleChange}
                onEdit={handleEdit}
                onEditCancel={handleEditCancel}/>
            )
          }

          let props = iterator.getIterableProps(id)

          return props && (
            <PhotoListItem
              {...props}
              key={id}
              title={dc.title}
              isExpanded={!!iterator.expandedPhotos[id]}
              isEditing={editing === id}
              onChange={handleChange}
              onEdit={handleEdit}
              onEditCancel={handleEditCancel}/>
          )
        }}
      </Scroll>
    </div>
  )
}
