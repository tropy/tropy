import React, { useRef, useState } from 'react'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { useDragHandler } from '../../hooks/use-drag-handler.js'
import { isMeta } from '../../keymap.js'
import { bounds, has } from '../../dom.js'

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
    onDragStart(event, target) {
      setDragging(false)

      drag.current = {
        cursor: cursor.current,
        origin: bounds(event.target),
        selection,
        target
      }

      if (Array.isArray(target)) {
        if (event.shiftKey) {
          drag.current.modifier = 'add'
        } else if (isMeta(event)) {
          drag.current.modifier = 'flip'
        }
      } else {
        if (event.shiftKey) {
          drag.current.modifier = 'add'
          setSelection(document.range(target, cursor.current, selection))

        } else if (isMeta(event)) {
          drag.current.modifier = 'flip'
          setSelection(
            (new Map(selection)).set(target, !selection.get(target)))

        } else {
          setSelection(document.range(target))
        }

        cursor.current = target
      }
    },
    onDrag() {
      if (!isDragging)
        setDragging(true)
    },
    onDragStop(event, wasCancelled) {
      if (wasCancelled)
        setSelection(drag.current.selection)

      drag.current = null
      setDragging(false)
    }
  })

  let handleMouseEnterLine = useEvent((event, strings) => {
    if (!drag.current)
      return

    let { origin, target } = drag.current

    if (Array.isArray(target)) {
      if (strings[0] === target[0] && strings[1] === target[1])
        return
    } else {
      if (strings.includes(target))
        return
    }

    let isForward = event.clientY > origin.bottom ||
      (event.clientY >= origin.top && event.clientX >= origin.left)

    let string = strings[isForward ? 0 : 1]
    if (string)
      handleMouseEnter(event, string)
  })

  let handleMouseEnter = useEvent((event, string) => {
    if (!string || !drag.current)
      return

    let { target, origin } = drag.current

    if (Array.isArray(target)) {
      let isForward = event.clientY > origin.bottom ||
        (event.clientY >= origin.top && event.clientX >= origin.left)

      cursor.current = target[isForward ? 1 : 0]
    }

    switch (drag.current.modifier) {
      case 'add':
        setSelection(
          document.range(
            drag.current.cursor,
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
              onMouseEnter={isDragging ? handleMouseEnterLine : null}
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

const lhs = (line) => ([
  line.previous()?.last(),
  line.first()
])

const rhs = (line) => ([
  line.last(),
  line.next()?.first(),
])

export const Line = ({
  children,
  value,
  onMouseDown,
  onMouseEnter
}) => (
  <div className="text-line">
    <div
      className="start-line"
      onMouseDown={(event) => { onMouseDown(event, lhs(value)) }}
      onMouseEnter={(event) => { onMouseEnter?.(event, lhs(value)) }}/>
    {children}
    <div
      className="end-line"
      onMouseDown={(event) => { onMouseDown(event, rhs(value)) }}
      onMouseEnter={(event) => { onMouseEnter?.(event, rhs(value)) }}/>
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
