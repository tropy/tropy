export const Page = ({
  columns = 1,
  items,
  from,
  gap,
  to,
  renderExpansion,
  renderItem
}) => {
  let output = items.slice(from, to).map((item, i) =>
    renderItem(item, from + i))

  if (gap != null && gap.index >= from && gap.index < to) {
    let item = items[gap.index]

    output.splice((gap.row + 1) * columns - from, 0, (
      <li
        key={`expansion-${item.id}`}
        className="tile-expansion"
        style={{ gridColumnEnd: columns + 1 }}>
        {renderExpansion(item, columns)}
      </li>
    ))
  }

  return output
}
