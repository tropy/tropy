import { join } from 'node:path'

import editor from '../fixtures/editor.js'
import exportFixtures from '../fixtures/export.js'
import items from '../fixtures/items.js'
import lists from '../fixtures/lists.js'
import metadata from '../fixtures/metadata.js'
import notes from '../fixtures/notes.js'
import ontology from '../fixtures/ontology.js'
import photos from '../fixtures/photos.js'
import projects from '../fixtures/projects.js'
import selections from '../fixtures/selections.js'
import tags from '../fixtures/tags.js'
import transcriptions from '../fixtures/transcriptions.js'

const ROOT = join(import.meta.dirname, '../fixtures')

global.F = {
  editor,
  export: exportFixtures,
  items,
  lists,
  metadata,
  notes,
  ontology,
  photos,
  projects,
  selections,
  tags,
  transcriptions,

  get appDir() {
    return join(ROOT, '../..')
  },

  images(name) {
    return {
      path: join(ROOT, 'images', name)
    }
  },

  db(name) {
    return {
      path: join(ROOT, 'db', name)
    }
  },

  schema(name) {
    return {
      path: join(ROOT, '../../db/schema', `${name}.sql`)
    }
  },

  plugins(...args) {
    return {
      path: join(ROOT, 'plugins', ...args)
    }
  },

  get preload() {
    return join(import.meta.dirname, 'bootstrap.mjs')
  }
}
