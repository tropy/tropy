import { useDispatch, useSelector } from 'react-redux'
import { Scroll } from '../scroll/index.js'
import { PhotoListItem } from './list-item.js'
import { SelectionListItem } from '../selection/list-item.js'
import { usePhotoIterator } from './use-photo-iterator.js'
import { useEvent } from '../../hooks/use-event.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { SASS, TABS } from '../../constants/index.js'
import { dc } from '../../ontology/ns.js'
import cx from 'classnames'
import * as act from '../../actions/index.js'


export const PhotoList = (props) => {
  let { isDisabled } = props
  let dispatch = useDispatch()

  let iterator = usePhotoIterator(props)
  let editing = useSelector(state => state.edit.photo)
  let editingSelection = useSelector(state => state.edit.selection)

  // List items are memoized: these handlers are stable.
  // Edits a photo or a selection (it has a photo field).
  let handleEdit = useEvent((el) => {
    if (el == null || isDisabled)
      return

    if (el.photo == null)
      dispatch(act.edit.start({ photo: el.id }))
    else
      dispatch(act.edit.start({ selection: el.id }))
  })

  let handleEditCancel = useEvent((...args) => {
    dispatch(act.edit.cancel(...args))
    iterator.scroll.current.focus()
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

  let onKeyDown = useCursorKeys(iterator.navigation, {
    onMove: iterator.move,
    onKeyDown: commands
  })

  return iterator.connect(
    <div className={cx('photo-list', iterator.classes)}>
      <Scroll
        ref={iterator.scroll}
        cursor={iterator.cursor}
        items={iterator.sequence}
        itemHeight={SASS.ROW.HEIGHT}
        tabIndex={TABS.PhotoList}
        onKeyDown={onKeyDown}
        onLayoutChange={iterator.onLayoutChange}>
        {(el) => (el.photo == null) ? (
          <PhotoListItem
            {...iterator.getIterableProps(el)}
            key={el.id}
            title={dc.title}
            isExpanded={!!iterator.expandedPhotos[el.id]}
            isEditing={editing === el.id}
            onChange={handleChange}
            onEdit={handleEdit}
            onEditCancel={handleEditCancel}/>
        ) : (
          <SelectionListItem
            {...iterator.getSelectionProps(el)}
            key={el.id}
            title={dc.title}
            isEditing={editingSelection === el.id}
            onChange={handleChange}
            onEdit={handleEdit}
            onEditCancel={handleEditCancel}/>
        )}
      </Scroll>
    </div>
  )
}
