export const FieldDragPreview = ({ item }) => (
  <div className="metadata-field drag-preview">
    <div className="drag-preview-container">
      {item.value}
      {item.isMixed && <span>+</span>}
    </div>
    {item.id.length > 1 &&
      <div className="badge">{item.id.length}</div>}
  </div>
)
