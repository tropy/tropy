import { Icon } from '../icons.js'

export const NodeDragPreview = ({ item }) => (
  <div
    className="node drag-preview"
    style={{
      paddingLeft: item.padding
    }}>
    <div className="drag-preview-container">
      <Icon name={item.icon}/>
      <div className="name">
        {item.name}
      </div>
    </div>
  </div>
)
