import { arrayOf, bool, string } from 'prop-types'
import { IconCircle, IconCrescentCircle } from './icons.js'

export const Circle = ({ color, isCrescent }) =>
  isCrescent ?
    <IconCrescentCircle className={`color-${color}`}/> :
    <IconCircle className={`color-${color}`}/>

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
