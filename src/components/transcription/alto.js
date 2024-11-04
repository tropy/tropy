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

const flip = (a, b) =>
  a.entries().reduce((m, [k, v]) =>
    v ? m.set(k, !m.get(k)) : m, new Map(b))

export const Alto = React.memo(({
  document,
  outline = 'none'
}) => {
  let cursor = useRef(null)
  let drag = useRef(null)

  let [isDragging, setDragging] = useState(false)
  let [selection, setSelection] = useState(new Map)

  let handleClick = useEvent((event) => {
    if (!drag.current && isClickOutside(event.target)) {
      cursor.current = null
      setSelection(new Map)
    }
  })

  let handleMouseDown = useDragHandler({
    onDragStart(event, string, isOutside) {
      setDragging(false)

      drag.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }

      if (event.shiftKey) {
        drag.current.modifier = 'add'
        drag.current.selection = document.range(string, cursor.current, selection)

        if (!isOutside)
          setSelection(drag.current.selection)

      } else if (isMeta(event)) {
        drag.current.modifier = 'flip'
        drag.current.selection = selection

        if (!isOutside)
          setSelection((new Map(selection)).set(string, !selection.get(string)))

      } else {
        if (!isOutside)
          setSelection(document.range(string))
      }

      cursor.current = string
    },
    onDrag(event) {
      if (!isDragging) {
        if (distance(drag.current, event).total > 20)
          setDragging(true)
      }
    },
    onDragStop() {
      drag.current = null
      setDragging(false)
    }
  })

  let handleMouseEnter = useEvent((event, string) => {
    if (!string || !isDragging)
      return

    switch (drag.current.modifier) {
      case 'add':
        setSelection(
          document.range(
            cursor.current,
            string,
            drag.current.selection
          ))
        break
      case 'flip':
        setSelection(
          flip(
            document.range(cursor.current, string),
            drag.current.selection
          ))
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
