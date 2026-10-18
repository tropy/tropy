import { memo } from 'react'
import cx from 'classnames'
import { Scroll } from '../scroll/index.js'
import { useSequence } from '../../hooks/use-sequence.js'

export const List = ({
  className,
  commands,
  isDisabled,
  keymap,
  onContextMenu,
  onOpen,
  onSelect,
  onSelectedClick,
  renderItem,
  rowHeight,
  scrollKeys,
  selection,
  sequence,
  tabAutoFocus = true,
  tabIndex
}) => {
  let [{
    cursor,
    onClick,
    onLayoutChange,
    onTabFocus
  }, eventHandlers, getElementProps] = useSequence(sequence, {
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
        itemHeight={rowHeight}
        tabIndex={tabIndex}
        onClick={onClick}
        onLayoutChange={onLayoutChange}
        onTabFocus={tabAutoFocus ? onTabFocus : null}>
        {(element, index) => (
          <ListItem
            {...getElementProps(element, index)}
            key={element.id ?? element}
            element={element}
            renderItem={renderItem}/>
        )}
      </Scroll>
    </div>
  )
}

const ListItem = memo(({
  element,
  index,
  isSelected,
  renderItem
}) => (
  <li
    className={cx({ selected: isSelected })}
    data-index={index}>
    {renderItem(element, { index, isSelected })}
  </li>
))
