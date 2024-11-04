import React, { useRef, useState } from 'react'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { useDragHandler } from '../../hooks/use-drag-handler.js'
import { isMeta } from '../../keymap.js'
import { distance, has } from '../../dom.js'

const isClickOutside = (
  node,
  classes = ['alto-document', 'start-line', 'end-line']
) => classes.some((name) => has(node, name))

export const Alto = React.memo(({
  document,
  outline = 'none'
}) => {
  let cursor = useRef(null)
  let status = useRef(null)

  let [isDragging, setDragging] = useState(false)
  let [selection, setSelection] = useState(new Map)

  let handleClick = useEvent((event) => {
    if (!status.current && isClickOutside(event.target)) {
      cursor.current = null
      setSelection(new Map)
    }
  })

  let handleMouseDown = useDragHandler({
    onDragStart(event, string, isOutside) {
      setDragging(false)

      status.current = {
        clientX: event.clientX,
        clientY: event.clientY
      }

      if (event.shiftKey) {
        status.current.modifier = 'add'

        if (!isOutside)
          setSelection(document.range(string, cursor.current, selection))

      } else if (isMeta(event)) {
        let isSelected = selection.get(string)
        status.current.modifier = isSelected ? 'remove' : 'add'

        if (!isOutside)
          setSelection((new Map(selection)).set(string, !isSelected))

      } else {
        if (!isOutside)
          setSelection(document.range(string))
      }

      cursor.current = string
    },
    onDrag(event) {
      if (!isDragging) {
        if (distance(status.current, event).total > 20)
          setDragging(true)
      }
    },
    onDragStop() {
      status.current = null
      setDragging(false)
    }
  })

  let handleMouseEnter = useEvent((event, string) => {
    if (!string || !isDragging)
      return

    switch (status.current.modifier) {
      case 'add':
        setSelection(document.range(cursor.current, string, selection))
        break
      case 'remove':
        for (let [s, remove] of document.range(cursor.current, string)) {
          if (remove) selection.set(s, false)
        }
        setSelection(new Map(selection))
        break
      default:
        setSelection(document.range(cursor.current, string))
    }
  })

  return (
    <section
      className={cx('alto-document', `outline-${outline}`)}
      onClick={handleClick}>
      {document.blocks().map((block, bidx) => (
        <TextBlock key={bidx}>
          {block.lines().map((line, lidx) => (
            <Line
              key={lidx}
              onMouseDown={handleMouseDown}
              onMouseEnter={isDragging ? handleMouseEnter : null}
              value={line}>
              {line.strings().map((string, sidx) => (
                <String
                  key={sidx}
                  isSelected={selection?.get(string)}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={isDragging ? handleMouseEnter : null}
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
  value,
  onMouseDown,
  onMouseEnter
}) => (
  <div className="text-line">
    <div
      className="start-line"
      onMouseDown={(event) => {
        onMouseDown(event, value.first(), true)
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event, value.previous()?.last() || value.first())
      }}/>
    {children}
    <div
      className="end-line"
      onMouseDown={(event) => {
        onMouseDown(event, value.last(), true)
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event, value.last())
      }}/>
  </div>
)

export const String = ({
  isSelected = false,
  onMouseDown,
  onMouseEnter,
  value
}) => (
  <div
    className={cx('string', { selected: isSelected })}
    onMouseDown={(event) => { onMouseDown(event, value) }}
    onMouseEnter={(event) => { onMouseEnter?.(event, value) }}>
    {value.CONTENT}
  </div>
)
