import React from 'react'
import cx from 'classnames'

export const Alto = React.memo(({
  document,
  outline = 'none' // eslint-disable-line no-unused-vars
}) => {

  return (
    <section className="cx('alto-document', `outline-${outline}`)">
      {document.blocks().map((block, bidx) => (
        <TextBlock key={bidx}>
          {block.lines().map((line, lidx) => (
            <Line key={lidx}>
              {line.strings().map((string, sidx) => (
                <String
                  key={sidx}
                  isSelected={false}
                  value={string.CONTENT}/>
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

export const String = ({ isSelected = false, value }) => (
  <span className={cx('string', { selected: isSelected })}>
    {value}
  </span>
)
