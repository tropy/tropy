import React from 'react'
import { arrayOf, bool, number, object, string } from 'prop-types'
import { IconCircle, IconCrescentCircle } from './icons'

export const Circle = ({ color, isCrescent }) =>
  isCrescent ?
    <IconCrescentCircle className={`color-${color}`}/> :
    <IconCircle className={`color-${color}`}/>

Circle.propTypes = {
  color: string.isRequired,
  isCrescent: bool
}

export const TagColors = (props) => {
  let colors = getColors(props)

  return (colors.length === 0) ? null : (
    <div className="tag-colors">
      {colors.map((color, idx) =>
        <Circle key={color} color={color} isCrescent={idx > 0}/>)}
    </div>
  )
}

TagColors.propTypes = {
  selection: arrayOf(number).isRequired,
  tags: object
}


function getColors(props) {
  let skip = {}
  let colors = []

  for (let id of props.selection) {
    let color = props.tags?.[id]?.color
    if (color && !(color in skip)) {
      colors.push(color)
      skip[color] = true
    }
  }

  return colors
}
