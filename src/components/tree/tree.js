// import cx from 'classnames'

// export const Tree = ({
//   children,
//   className,
//   isDraggingParent = false,
//   depth,
//   nodes,
//   root
// }) => {

// return (
//   <ol className={cx('tree', className)}>
//     {root.children.map((id, position, all) => {
//       return (id in nodes) && (
//         <Node
//           key={id}
//           node={nodes[id]}
//           depth={depth}
//           position={position}
//           isDraggingParent={isDraggingParent}
//           isLastChild={position === all.length - 1}>
//         {(isDragging) => (
//           <>

//           <Tree
//             depth={depth + 1}
//             minDropDepth={position === all.length - 1 ? minDropDepth : depth}
//             isDraggingParent={isDraggingParent || isDragging}
//             nodes={nodes}
//             root={node}>
//             {children}
//           </Tree>
//           </>
//         ))
//         </Node>
//     })}
//   </ol>
// )
// }
