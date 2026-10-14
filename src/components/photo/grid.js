import { usePhotoIterator } from './use-photo-iterator.js'
import { PhotoTile } from './tile.js'
import { SelectionGrid } from '../selection/grid.js'
import { Scroll } from '../scroll/scroll.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import cx from 'classnames'
import { SASS, TABS } from '../../constants/index.js'


export const PhotoGrid = (props) => {
  let { isDisabled, size } = props

  let iterator = usePhotoIterator(props, { isGrid: true })
  let { photos } = iterator

  let commands = useKeyMap('PhotoIterator', {
    contract () {
      return iterator.contract(iterator.current())
    },
    expand () {
      return iterator.expand(iterator.current())
    },
    enter () {
      return iterator.expand(iterator.current())
    },
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

  let onKeyDown = useCursorKeys(iterator.navigation, {
    onMove: iterator.move,
    onKeyDown: commands
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
      onSort={iterator.sortSelections}
      photo={photo}
      size={size}/>
  )

  let tileSize = Math.round(size * SASS.TILE.FACTOR)

  return iterator.connect(
    <div
      className={cx('photo-grid', iterator.classes)}
      data-size={size}>
      <Scroll
        ref={iterator.scroll}
        cursor={iterator.cursor}
        items={photos}
        itemHeight={tileSize}
        itemWidth={tileSize}
        expandedItems={iterator.expandedPhotos}
        expansionPadding={SASS.GRID.PADDING * 4}
        renderExpansionRow={renderSelectionGrid}
        tabIndex={TABS.PhotoGrid}
        onKeyDown={onKeyDown}
        onLayoutChange={iterator.onLayoutChange}>
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
