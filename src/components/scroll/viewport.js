export const Viewport = ({
  children,
  columns,
  offset = 0,
  tag: Tag = 'ul'
}) => (
  <Tag
    className="viewport"
    style={{
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      transform: `translate3d(0,${offset}px,0)`
    }}>
    {children}
  </Tag>
)
