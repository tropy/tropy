import { IconFolder } from '../icons.js'
import { number, shape, string } from 'prop-types'

export const ListDragPreview = ({ item }) => (
  <div className="list drag-preview" style={{
    paddingLeft: item.padding
  }}>
    <div className="drag-preview-container">
      <IconFolder/>
      <div className="name">
        {item.name}
      </div>
    </div>
  </div>
)

ListDragPreview.propTypes = {
  item: shape({
    name: string.isRequired,
    padding: number.isRequired
  }).isRequired
}
