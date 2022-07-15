import {
  arrayOf,
  bool,
  number,
  oneOfType,
  shape,
  string
} from 'prop-types'

export const FieldDragPreview = ({ item }) => (
  <div className="metadata-field drag-preview">
    <div className="drag-preview-container">
      {item.value}
      {item.isMixed && <span>+</span>}
    </div>
    {item.id.length > 1 &&
      <div className="badge">{item.id.length}</div>
    }
  </div>
)

FieldDragPreview.propTypes = {
  item: shape({
    id: oneOfType([number, arrayOf(number)]).isRequired,
    isMixed: bool,
    value: string
  }).isRequired
}
