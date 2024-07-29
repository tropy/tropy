export const AutoResizer = ({ children, content, isDisabled }) =>
  isDisabled ? children : (
    <div className="auto-resizer">
      <div className="content">{content}</div>
      {children}
    </div>
  )
