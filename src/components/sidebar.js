export const Sidebar = ({ children }) => (
  <header className="sidebar">{children}</header>
)

export const SidebarBody = ({ children, ...props }) => (
  <div className="sidebar-body" {...props}>
    {children}
  </div>
)
