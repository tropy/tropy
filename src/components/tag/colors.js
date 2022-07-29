import { useSelector } from 'react-redux'
import { arrayOf, number } from 'prop-types'
import { Colors } from '../colors.js'
import { getTagColors } from '../../selectors/tags.js'

export function TagColors({ tags }) {
  let colors = useSelector(state => getTagColors(state, tags))

  return (
    <Colors className="tag-colors" colors={colors}/>
  )
}

TagColors.propTypes = {
  tags: arrayOf(number).isRequired
}
