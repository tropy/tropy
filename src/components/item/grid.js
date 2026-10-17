import { ItemTile } from './tile.js'
import { Scroll } from '../scroll/index.js'
import { useItemIterator } from './use-item-iterator.js'
import cx from 'classnames'
import { SASS, TABS } from '../../constants/index.js'


export const ItemGrid = (props) => {
  let iterator = useItemIterator(props, {
    tabIndex: TABS.ItemGrid
  })

  let { items, scroll } = iterator
  let { size } = props

  let tileSize = Math.round(size * SASS.TILE.FACTOR)

  return iterator.connect(
    <div
      {...iterator.handlers}
      className={cx('item-grid', { over: iterator.isOver })}
      data-size={size}>
      <Scroll
        ref={scroll}
        {...iterator.scrollProps}
        itemHeight={tileSize}
        itemWidth={tileSize}
        tabIndex={iterator.tabIndex}>
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
