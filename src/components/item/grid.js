import { ItemTile } from './tile.js'
import { Scroll } from '../scroll/index.js'
import { useItemIterator } from './use-item-iterator.js'
import cx from 'classnames'
import { SASS, TABS } from '../../constants/index.js'


export const ItemGrid = (props) => {
  let { items, selection, size } = props

  let iterator = useItemIterator(props, {
    isGrid: true,
    tabIndex: TABS.ItemGrid
  })

  let tileSize = Math.round(size * SASS.TILE.FACTOR)

  return iterator.connect(
    <div
      className={cx('item-grid', { over: iterator.isOver })}
      data-size={size}>
      <Scroll
        ref={iterator.scroll}
        autoselect
        cursor={selection.cursor}
        items={items}
        itemHeight={tileSize}
        itemWidth={tileSize}
        tabIndex={iterator.tabIndex}
        onClick={iterator.clearSelection}
        onKeyDown={iterator.onKeyDown}
        onSelect={iterator.handleSelectItem}>
        {(item, index) => (
          <ItemTile
            {...iterator.getIterableProps(item, index)}
            key={item.id}
            isLast={index >= items.length - 1}/>
        )}
      </Scroll>
    </div>
  )
}
