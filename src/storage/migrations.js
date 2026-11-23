export const project = {
  ignore: ['project.watch', 'project.optimize'],

  migrations: [
    {
      number: 1,
      // Drops old, unused props.
      // Converts nav view and item selection.
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
    },
    {
      number: 2,
      // Moves nav.columns out of nav.
      up: ({ nav, ...state }) => {
        if (nav?.columns == null)
          return { ...state, nav }

        let { columns, ...rest } = nav
        return { ...state, nav: rest, columns }
      }
    },
    {
      number: 3,
      // Nests nav by slice: search, selection, mode.
      // The query and tags are not restored.
      up: ({ nav, ...state }) => {
        if (nav == null)
          return { ...state, nav }

        let { view, sort, item, photo, selection, note, mode } = nav

        return {
          ...state,
          nav: {
            search: { view, sort },
            selection: { item, photo, selection, note },
            mode
          }
        }
      }
    },
    {
      number: 4,
      // Use combined photo/selection selection
      up: ({ nav, ...state }) => {
        if (nav?.selection == null)
          return { ...state, nav }

        let { photo, selection, ...rest } = nav.selection
        let id = selection ?? photo

        return {
          ...state,
          nav: {
            ...nav,
            selection: {
              ...rest,
              photo: {
                selected: (id == null) ? {} : { [id]: true },
                anchor: id ?? null,
                cursor: id ?? null
              }
            }
          }
        }
      }
    },
    {
      number: 5,
      // Use note selection state, with the last note per parent.
      up: ({ nav, ...state }) => {
        if (nav?.selection == null)
          return { ...state, nav }

        let { note, photo } = nav.selection
        let parent = photo?.cursor

        return {
          ...state,
          nav: {
            ...nav,
            selection: {
              ...nav.selection,
              note: {
                selected: (note == null) ? {} : { [note]: true },
                anchor: note ?? null,
                cursor: note ?? null
              },
              last: (note == null || parent == null) ? {} : { [parent]: note }
            }
          }
        }
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
