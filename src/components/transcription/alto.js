import React, { useRef, useState } from 'react'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { useDragHandler } from '../../hooks/use-drag-handler.js'
import { isMeta } from '../../keymap.js'


export const Alto = React.memo(({
  document,
  outline = 'none'
}) => {
  let anchor = useRef(null)
  let [selection, setSelection] = useState(document.range())

  let [handleMouseDown, status] = useDragHandler({
    onClick(event, string) {
      if (event.shiftKey) {
        setSelection(document.range(string, anchor.current, selection))
      } else if (isMeta(event)) {
        selection.set(string, !selection.get(string))
        setSelection(new Map(selection))
      } else {
        setSelection(document.range(string))
      }

      anchor.current = string
    },
    onDragStart(event, string) {
      setSelection(document.range(string))
      anchor.current = string
    },
    onDragStop() {
      anchor.current = null
    }
  })

  let handleMouseEnter = useEvent((string) => {
    if (status.current?.isDragging)
      setSelection(document.range(anchor.current, string))
  })

  return (
    <section className={cx('alto-document', `outline-${outline}`)}>
      {document.blocks().map((block, bidx) => (
        <TextBlock key={bidx}>
          {block.lines().map((line, lidx) => (
            <Line
              key={lidx}
              isDragging={status.current?.isDragging}
              onMouseEnter={handleMouseEnter}
              value={line}>
              {line.strings().map((string, sidx) => (
                <String
                  key={sidx}
                  isDragging={status.current?.isDragging}
                  isSelected={selection?.get(string)}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  value={string}/>
              )).toArray()}
            </Line>
          )).toArray()}
        </TextBlock>
      )).toArray()}
    </section>
  )
})

export const TextBlock = ({ children }) => (
  <div className="text-block">
    {children}
  </div>
)

export const Line = ({
  children,
  isDragging = false,
  value,
  onMouseEnter
}) => (
  <div className="text-line">
    <div
      className="start-line"
      onMouseEnter={isDragging ? () => {
        onMouseEnter(value.previous()?.last() || value.first())
      } : null}/>
    {children}
    <div
      className="end-line"
      onMouseEnter={isDragging ? () => {
        onMouseEnter(value.last())
      } : null}/>
  </div>
)

export const String = ({
  isDragging = false,
  isSelected = false,
  onMouseDown,
  onMouseEnter,
  value
}) => (
  <div
    className={cx('string', { selected: isSelected })}
    onMouseDown={(event) => { onMouseDown(event, value) }}
    onMouseEnter={isDragging ? () => { onMouseEnter(value) } : null}>
    {value.CONTENT}
  </div>
)
