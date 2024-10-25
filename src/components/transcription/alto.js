import React, { useMemo } from 'react'
import cx from 'classnames'

export const AltoDocument = ({
  data,
  outline = 'none' // eslint-disable-line no-unused-vars
}) => {
  let blocks = useMemo(() => (
    [...data.blocks()]
  ), [data])


  return (
    <section className="cx('alto-document', `outline-${outline}`)">
      {blocks.map((block, index) => (
        <TextBlock
          key={index}
          lines={Array.from(block.lines())}/>
      ))}
    </section>
  )
}

export const TextBlock = ({ lines }) => (
  <div className="text-block">
    {lines.map((line, index) => (
      <Line key={index} strings={Array.from(line.strings())}/>
    ))}
  </div>
)

export const Line = ({ strings }) => (
  <div className="text-line">
    {strings.map((string, index) => (
      <String key={index} value={string.CONTENT}/>
    ))}
  </div>
)

export const String = ({ isSelected = false, value }) => (
  <span className={cx('string', { selected: isSelected })}>
    {value}
  </span>
)
