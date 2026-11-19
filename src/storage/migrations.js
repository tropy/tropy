export const project = {
  ignore: ['project.watch', 'project.optimize'],

  migrations: [
    {
      number: 1,
      // Drops old unused props. Converts nav view and item selection.
      up: ({ nav, activities, notepad, esper, sidebar, panel }) => {
        if (nav != null) {
          nav = {
            ...nav,
            view: legacyView(nav),
            item: legacyItems(nav)
          }

          for (let key of ['list', 'trash', 'activity', 'imports', 'items'])
            delete nav[key]
        }

        return { nav, activities, notepad, esper, sidebar, panel }
      }
    }
  ]
}

function legacyView ({ view, list, trash }) {
  switch (view?.name) {
    case 'project':
    case 'list':
    case 'unlisted':
    case 'trash':
    case 'activity':
      return view
  }

  if (trash) return { name: 'trash' }
  if (list === -1) return { name: 'unlisted' }
  if (list > 0) return { name: 'list', id: list }
}

function legacyItems ({ item, items }) {
  if (!(items?.length > 0))
    return item

  return {
    selected: Object.fromEntries(items.map(id => [id, true])),
    anchor: items.at(-1),
    cursor: items.at(-1)
  }
}
