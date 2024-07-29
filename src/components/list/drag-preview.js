import { IconFolder } from '../icons.js'

export const ListDragPreview = ({ item }) => (
  <div
    className="list drag-preview"
    style={{
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
