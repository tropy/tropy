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

  let iterator = usePhotoIterator(props)
  let { scroll, sequence } = iterator

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

  let onKeyDown = useCursorKeys(iterator.cursor, {
    onMove: iterator.move,
    onKeyDown: commands
  })

  let renderSelectionGrid = (id, columns) => (
    <SelectionGrid
      cols={columns}
      isDisabled={isDisabled}
      onContextMenu={iterator.contextMenu}
      onDelete={iterator.remove}
      onItemOpen={iterator.open}
      onRotate={iterator.rotate}
      onSelect={iterator.select}
      onSort={iterator.sortSelections}
      photo={iterator.resolve(id).photo}
      size={size}/>
  )

  let tileSize = Math.round(size * SASS.TILE.FACTOR)

  return iterator.connect(
    <div
      className={cx('photo-grid', iterator.classes)}
      style={{ '--size': size }}>
      <Scroll
        ref={scroll}
        cursor={iterator.cursor}
        itemHeight={tileSize}
        itemWidth={tileSize}
        expansion={iterator.expansion && {
          ...iterator.expansion,
          padding: SASS.GRID.PADDING * 4
        }}
        renderExpansion={renderSelectionGrid}
        tabIndex={TABS.PhotoGrid}
        onKeyDown={onKeyDown}
        onLayoutChange={iterator.onLayoutChange}>
        {(id, index) => {
          let props = iterator.getIterableProps(id)

          return props && (
            <PhotoTile
              {...props}
              key={id}
              isExpanded={iterator.isExpanded(id)}
              isLast={index >= sequence.length - 1}/>
          )
        }}
      </Scroll>
    </div>
  )
}
