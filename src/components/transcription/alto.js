import React from 'react'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'

export const Alto = React.memo(({
  document,
  outline = 'none'
}) => {

  let handleMouseDown = useEvent(() => {
    // start live selection mode
    // cancel if mouse outside window
  })

  let handleMouseUp = useEvent(() => {
    // stop live selection mode
    // save selection if not empty
  })

  let handleMouseEnter = useEvent(() => {
    // update live selection
  })

  return (
    <section
      className={cx('alto-document', `outline-${outline}`)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}>
      {document.blocks().map((block, bidx) => (
        <TextBlock key={bidx}>
          {block.lines().map((line, lidx) => (
            <Line key={lidx}>
              {line.strings().map((string, sidx) => (
                <String
                  key={sidx}
                  isSelected={false}
                  onMouseEnter={handleMouseEnter}
                  value={string}/>
              ))}
            </Line>
          ))}
        </TextBlock>
      ))}
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
  onMouseEnter,
  value
}) => (
  <span
    className={cx('string', { selected: isSelected })}
    onMouseEnter={() => { onMouseEnter(value) }}>
    {value.CONTENT}
  </span>
)
