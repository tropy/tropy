import { IconCircle, IconCrescentCircle, IconTag } from './icons.js'

const ccx = (color) => color && `color-${color}`

export const Circle = ({ color, isCrescent }) =>
  isCrescent ?
      <IconCrescentCircle className={ccx(color)}/> :
      <IconCircle className={ccx(color)}/>

export const Colors = ({ className = 'colors', colors }) => (
  (!colors.length) ? null : (
    <div className={className}>
      {colors.map((color, idx) => (
        <Circle
          key={color}
          color={color}
          isCrescent={idx > 0}/>
      ))}
    </div>
  ))

export const TagColor = ({ color }) => (
  <IconTag className={ccx(color)}/>
)
