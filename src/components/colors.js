import { arrayOf, bool, string } from 'prop-types'
import { IconCircle, IconCrescentCircle, IconTag } from './icons.js'

const ccx = (color) => color && `color-${color}`

export const Circle = ({ color, isCrescent }) =>
  isCrescent ?
    <IconCrescentCircle className={ccx(color)}/> :
    <IconCircle className={ccx(color)}/>

Circle.propTypes = {
  color: string.isRequired,
  isCrescent: bool
}

export const Colors = ({ className, colors }) => (
  (!colors.length) ? null : (
    <div className={className}>
      {colors.map((color, idx) =>
        <Circle
          key={color}
          color={color}
          isCrescent={idx > 0}/>)}
    </div>
  ))

Colors.propTypes = {
  className: string,
  colors: arrayOf(string).isRequired
}

Colors.defaultProps = {
  className: 'colors'
}

export const TagColor = ({ color }) => (
  <IconTag className={ccx(color)}/>
)

TagColor.propTypes = {
  color: string
}
