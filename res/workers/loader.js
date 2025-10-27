const loadImageBitmap = async (url, alphaMode) => {
  let response = await fetch(url)

  if (!response.ok) {
    throw new Error(`fetch failed with status: ${response.status}`)
  }

  let blob = await response.blob()
  let image = alphaMode === 'premultiplied-alpha' ?
      await createImageBitmap(blob, { premultiplyAlpha: 'none' }) :
      await createImageBitmap(blob)

  postMessage({
    payload: image,
    type: 'load',
    meta: { url }
  }, [image])
}

self.onmessage = async (event) => {
  try {
    switch (event.data?.type) {
      case 'load':
        var url = event.data.payload
        await loadImageBitmap(url)
        break
      default:
        throw new Error(`unknown load request: ${event.data}`)
    }
  } catch (e) {
    postMessage({
      error: true,
      type: 'error',
      payload: e,
      meta: { url }
    })
  }
}
