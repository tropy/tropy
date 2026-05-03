// RPC-style action manifest for the main process.
// See: src/saga/ipc.js

const a = (name) =>
  (payload, meta) => ({ name, payload, meta })

export const cache = {
  prune: a('cache.prune'),
  purge: a('cache.purge')
}

export const context = {
  clear: a('context.clear')
}

export const edit = {
  start: a('edit.start')
}

export const flash = {
  show: a('flash.show')
}

export const item = {
  create: a('item.create'),
  delete: a('item.delete'),
  destroy: a('item.destroy'),
  explode: a('item.explode'),
  export: a('item.export'),
  import: a('item.import'),
  merge: a('item.merge'),
  open: a('item.open'),
  print: a('item.print'),
  restore: a('item.restore'),
  tags: {
    clear: a('item.tags.clear'),
    delete: a('item.tags.delete'),
    toggle: a('item.tags.toggle')
  }
}

export const list = {
  delete: a('list.delete'),
  export: a('list.export'),
  import: a('list.import'),
  new: a('list.new'),
  items: {
    remove: a('list.items.remove')
  }
}

export const metadata = {
  delete: a('metadata.delete'),
  new: a('metadata.new')
}

export const note = {
  delete: a('note.delete'),
  export: a('note.export'),
  open: a('note.open')
}

export const notepad = {
  update: a('notepad.update')
}

export const ontology = {
  load: a('ontology.load'),
  template: {
    import: a('ontology.template.import')
  }
}

export const photo = {
  consolidate: a('photo.consolidate'),
  create: a('photo.create'),
  delete: a('photo.delete'),
  duplicate: a('photo.duplicate'),
  extract: a('photo.extract'),
  rotate: a('photo.rotate')
}

export const project = {
  close: a('project.close'),
  open: a('project.open'),
  optimize: a('project.optimize'),
  prune: a('project.prune'),
  reindex: a('project.reindex'),
  reload: a('project.reload')
}

export const selection = {
  delete: a('selection.delete')
}

export const settings = {
  persist: a('settings.persist')
}

export const storage = {
  reload: a('storage.reload')
}

export const tag = {
  delete: a('tag.delete'),
  edit: a('tag.edit'),
  export: a('tag.export'),
  new: a('tag.new'),
  save: a('tag.save')
}

export const transcriptions = {
  create: a('transcriptions.create')
}
