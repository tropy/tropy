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

const merge = (a, b) =>
  a.entries().reduce((m, [k, v]) =>
    v ? m.set(k, true) : m, new Map(b))

const select = (document, string, { cursor, selection, modifier }) => {
  switch (modifier) {
    case 'SHIFT':
      return merge(document.range(string, cursor), selection)
    case 'FLIP':
      return flip(document.range(string, cursor), selection)
    default:
      return document.range(string, cursor)
  }
}

export const Alto = React.memo(({
  document,
  outline = 'none'
}) => {
  let drag = useRef({})

  let [isDragging, setDragging] = useState(false)
  let [selection, setSelection] = useState(new Map)

  let handleClickOutside = useEvent((event) => {
    if (!isDragging && isClickOutside(event.target)) {
      setSelection(new Map)
      drag.current = {}
    }
  })

  let handleMouseDown = useDragHandler({
    onDragStart(event, target) {
      setDragging(false)
      let { current } = drag

      current.origin = bounds(event.target)
      current.target = target

      let prevModifier = current.modifier
      current.modifier = event.shiftKey ? 'SHIFT' : isMeta(event) ? 'FLIP' : null

      if (current.modifier === 'SHIFT') {
        if (prevModifier == null)
          current.selection = null
      } else {
        current.selection = selection
      }

      if (Array.isArray(target))
        return

      if (current.modifier !== 'SHIFT') {
        current.cursor = target
      }

      setSelection(select(document, target, current))
    },
    onDrag() {
      if (!isDragging)
        setDragging(true)
    },
    onDragStop(event, wasCancelled) {
      if (isDragging && wasCancelled) {
        setSelection(drag.current.selection || new Map)
        drag.current = {}
      }

      setDragging(false)
    }
  })

  let handleMouseEnterLine = useEvent((event, strings) => {
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
    if (!string)
      return

    let { current } = drag

    if (Array.isArray(current.target)) {
      let isForward = event.clientY > current.origin.bottom ||
        (event.clientY >= current.origin.top && event.clientX >= current.origin.left)

      current.cursor = current.target[isForward ? 1 : 0]
    }

    setSelection(select(document, string, current))
  })

  return (
    <section
      className={cx('alto-document', `outline-${outline}`)}
      onClick={handleClickOutside}>
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
