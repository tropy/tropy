import React, { useRef, useState } from 'react'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { useDragHandler } from '../../hooks/use-drag-handler.js'

function expand(a, b) {
  if (!a) return b
  if (!b) return a
  // todo
  return a
}

export const Alto = React.memo(({
  document,
  outline = 'none'
}) => {
  let anchor = useRef()
  let [selection, setSelection] = useState()

  let handleDragStart = useDragHandler({
    onDragStart(event, string) {
      anchor.current = string.bounds()
    },
    onDragEnd() {
      anchor.current = null
      setSelection(null)
    }
  })

  let handleMouseEnter = useEvent((string) => {
    setSelection(expand(anchor.current, string.bounds()))
  })

  return (
    <section className={cx('alto-document', `outline-${outline}`)}>
      {document.blocks().map((block, bidx) => (
        <TextBlock key={bidx}>
          {block.lines().map((line, lidx) => (
            <Line key={lidx}>
              {line.strings().map((string, sidx) => (
                <String
                  key={sidx}
                  isSelected={selection && string.intersects(selection)}
                  onMouseDown={handleDragStart}
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

export const Line = ({ children }) => (
  <div className="text-line">
    {children}
  </div>
)

export const String = ({
  isSelected = false,
  onMouseDown,
  onMouseEnter,
  value
}) => (
  <span
    className={cx('string', { selected: isSelected })}
    onMouseDown={(event) => { onMouseDown(event, value) }}
    onMouseEnter={() => { onMouseEnter(value) }}>
    {value.CONTENT}
  </span>
)
