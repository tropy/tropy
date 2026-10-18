import { memo } from 'react'
import cx from 'classnames'
import { Scroll } from '../scroll/index.js'
import { useSequence } from '../../hooks/use-sequence.js'

export const List = ({
  className,
  commands,
  isDisabled,
  itemClassName,
  itemHeight,
  items,
  keymap,
  onContextMenu,
  onOpen,
  onSelect,
  onSelectedClick,
  renderItem,
  scrollKeys,
  selection,
  tabAutoFocus = true,
  tabIndex
}) => {
  let [{
    cursor,
    onClick,
    onLayoutChange,
    onTabFocus
  }, eventHandlers, getItemProps] = useSequence(items, {
    commands,
    isDisabled,
    keymap,
    onContextMenu,
    onOpen,
    onSelect,
    onSelectedClick,
    scrollKeys,
    selection
  })

  return (
    <div className={className} {...eventHandlers}>
      <Scroll
        cursor={cursor}
        itemHeight={itemHeight}
        tabIndex={tabIndex}
        onClick={onClick}
        onLayoutChange={onLayoutChange}
        onTabFocus={tabAutoFocus ? onTabFocus : null}>
        {(element, index) => (
          <Row
            {...getItemProps(element, index)}
            key={element.id ?? element}
            className={itemClassName}
            element={element}
            renderItem={renderItem}/>
        )}
      </Scroll>
    </div>
  )
}

const Row = memo(({
  className,
  element,
  index,
  isSelected,
  renderItem
}) => (
  <li
    className={cx(className, { selected: isSelected })}
    data-index={index}>
    {renderItem(element, { index, isSelected })}
  </li>
))
