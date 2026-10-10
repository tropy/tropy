import { Scroll } from '../scroll/index.js'
import { PhotoListItem } from './list-item.js'
import { usePhotoIterator } from '../../hooks/use-photo-iterator.js'
import { useEvent } from '../../hooks/use-event.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { SASS, TABS } from '../../constants/index.js'
import { dc } from '../../ontology/ns.js'
import cx from 'classnames'


export const PhotoList = (props) => {
  let {
    data,
    edit = {},
    isDisabled,
    onChange,
    onEdit,
    onEditCancel,
    onSelectionSort,
    photos,
    selections
  } = props

  let iterator = usePhotoIterator(props)

  let handleEdit = useEvent((photo) => {
    if (photo == null || isDisabled)
      return

    if (photo.selection == null)
      onEdit({ photo: photo.id })
    else
      onEdit({ selection: photo.selection })
  })

  let handleEditCancel = useEvent((...args) => {
    onEditCancel(...args)
    iterator.scroll.current.focus()
  })

  let onKeyDown = useKeyMap('PhotoIterator', {
    contract: () => iterator.contract(iterator.current()),
    expand: () => iterator.expand(iterator.current()),
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

  return iterator.connect(
    <div className={cx('photo-list', iterator.classes)}>
      <Scroll
        ref={iterator.scroll}
        cursor={props.current}
        expansionCursor={props.selection}
        items={photos}
        itemHeight={SASS.ROW.HEIGHT}
        expandedItems={props.expandedPhotos}
        tabIndex={TABS.PhotoList}
        onKeyDown={onKeyDown}
        onSelect={iterator.select}>
        {(photo, index, { isExpanded }) => (
          <PhotoListItem
            {...iterator.getIterableProps(photo)}
            key={photo.id}
            data={data}
            edit={edit}
            selections={selections}
            title={dc.title}
            isExpanded={isExpanded}
            isEditing={edit.photo === photo.id}
            onChange={onChange}
            onEdit={handleEdit}
            onEditCancel={handleEditCancel}
            onSelectionSort={onSelectionSort}/>
        )}
      </Scroll>
    </div>
  )
}
