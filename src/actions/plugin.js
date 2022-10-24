import { prompt } from '../dialog'

export default {
  uninstall({ plugins, name }, meta = {}) {
    return async () => {
      if (meta.prompt !== false) {
        let { cancel } = await prompt('plugin.uninstall', {
          type: 'warning',
          message: name
        })

        if (cancel)
          return null
      }

      await plugins.uninstall(name)
    }
  }
}
