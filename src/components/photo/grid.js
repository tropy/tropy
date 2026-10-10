import { usePhotoIterator } from '../../hooks/use-photo-iterator.js'
import { PhotoTile } from './tile.js'
import { SelectionGrid } from '../selection/grid.js'
import { Scroll } from '../scroll/scroll.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { pluck } from '../../common/util.js'
import cx from 'classnames'
import { SASS, TABS } from '../../constants/index.js'


export const PhotoGrid = (props) => {
  let {
    isDisabled,
    onSelectionSort,
    photos,
    selections,
    size
  } = props

  let iterator = usePhotoIterator(props, { isGrid: true })

  let onKeyDown = useKeyMap('PhotoIterator', {
    contract: () => iterator.contract(iterator.current()),
    expand: () => iterator.expand(iterator.current()),
    enter: () => iterator.expand(iterator.current()),
    open () {
      iterator.open(iterator.current())
    },
    preview () {
      iterator.preview(iterator.current())
    },
    delete () {
      iterator.remove(iterator.current())
    },
    rotateLeft () {
      iterator.rotate(-90)
    },
    rotateRight () {
      iterator.rotate(90)
    },
    copyPhoto () {
      iterator.extract(iterator.current(), { target: ':clipboard:' })
    },
    extract () {
      iterator.extract(iterator.current())
    }
  })

  let renderSelectionGrid = (photo, columns) => (
    <SelectionGrid
      cols={columns}
      isDisabled={isDisabled}
      onContextMenu={iterator.contextMenu}
      onDelete={iterator.remove}
      onItemOpen={iterator.open}
      onRotate={iterator.rotate}
      onSelect={iterator.select}
      onSort={onSelectionSort}
      photo={photo}
      selections={pluck(selections, photo.selections)}
      size={size}/>
  )

  let tileSize = Math.round(size * SASS.TILE.FACTOR)

  return iterator.connect(
    <div
      className={cx('photo-grid', iterator.classes)}
      data-size={size}>
      <Scroll
        ref={iterator.scroll}
        cursor={props.current}
        items={photos}
        itemHeight={tileSize}
        itemWidth={tileSize}
        expandedItems={props.expandedPhotos}
        expansionPadding={SASS.GRID.PADDING * 4}
        renderExpansionRow={renderSelectionGrid}
        tabIndex={TABS.PhotoGrid}
        onKeyDown={onKeyDown}
        onSelect={iterator.select}>
        {(photo, index, { isExpanded }) => (
          <PhotoTile
            {...iterator.getIterableProps(photo)}
            key={photo.id}
            isExpanded={isExpanded}
            isLast={index >= photos.length - 1}/>
        )}
      </Scroll>
    </div>
  )
}
