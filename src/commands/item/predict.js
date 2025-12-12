import { Command } from '../command.js'
import { call, put, select } from 'redux-saga/effects'
import { ITEM } from '../../constants/index.js'
import { Cache } from '../../common/cache.js'
import { warn } from '../../common/log.js'
import { pluck, uniq } from '../../common/util.js'
import Esper from '../../esper/index.js'
import { fail } from '../../dialog.js'
import * as act from '../../actions/index.js'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgpu'

let mobilenet
let model
let classes

const MOBILE_NET_INPUT_HEIGHT = 224
const MOBILE_NET_INPUT_WIDTH = 224

window.tf = tf

async function loadMobileNetFeatureModel() {
  const URL =
    'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1'

  mobilenet = await tf.loadGraphModel(URL, { fromTFHub: true })
  console.log('MobileNet v3 loaded successfully!')

  // Warm up the model by passing zeros through it once.
  tf.tidy(function () {
    mobilenet.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3]))
  })
}

async function resetModel(size = classes.length) {
  model = tf.sequential()
  model.add(tf.layers.dense({ inputShape: [1024], units: 128, activation: 'relu' }))
  model.add(tf.layers.dense({ units: size, activation: 'softmax' }))

  model.summary()

  // Compile the model with the defined optimizer and specify a loss function to use.
  model.compile({
    // Adam changes the learning rate over time which is useful.
    optimizer: 'adam',
    // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
    // Else categoricalCrossentropy is used if more than 2 classes.
    loss: (size === 2) ? 'binaryCrossentropy' : 'categoricalCrossentropy',
    // As this is a classification problem you can record accuracy in the logs too!
    metrics: ['accuracy']
  })
}

async function train(input, output) {
  tf.util.shuffleCombo(input, output)
  let outputsAsTensor = tf.tensor1d(output, 'int32')
  let oneHotOutputs = tf.oneHot(outputsAsTensor, classes.length)
  let inputsAsTensor = tf.stack(input)

  let results = await model.fit(inputsAsTensor, oneHotOutputs, {
    shuffle: true,
    batchSize: 5,
    epochs: 10
  })
  outputsAsTensor.dispose()
  oneHotOutputs.dispose()
  inputsAsTensor.dispose()

  return results
}

export class Train extends Command {
  *exec() {
    try {
      let { cache } = this.options
      let id = this.action.payload
      let state = yield select()

      classes = []
      let photos = []

      for (let item of pluck(state.items, id || state.nav.items)) {
        classes = classes.concat(item.tags)

        for (let photo of pluck(state.photos, item.photos)) {
          photos.push({ photo, tags: item.tags })
        }
      }
      classes = uniq(classes)

      yield call(tf.setBackend, 'webgpu')
      yield call(tf.ready)

      yield loadMobileNetFeatureModel()
      yield resetModel(classes.length)

      let input = []
      let output = []

      for (let p of photos) {
        if (!p.tags.length) continue

        let src = Cache.url(cache.root, 'full', p.photo)
        let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
          ...p.photo
        })

        let features = tf.tidy(() => {
          let tensor = tf.browser.fromPixels({
            data: buffer,
            width: raw.width,
            height: raw.height
          })
          let resized = tf.image.resizeBilinear(
            tensor,
            [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
            true)
          let normalized = resized.div(255)
          return mobilenet.predict(normalized.expandDims()).squeeze()
        })

        for (let tag of p.tags) {
          input.push(features)
          output.push(tag)
        }
      }

      yield train(input, output)

    } catch (e) {
      warn({
        stack: e.stack
      }, `failed to train image: ${e.message}`)
      fail(e, this.action.type)
    }
  }
}

Train.register(ITEM.TRAIN)

export class Predict extends Command {
  *exec() {
    try {
      let { cache } = this.options
      let id = this.action.payload
      let state = yield select()

      let taggings = []

      for (let item of pluck(state.items, id || state.nav.items)) {
        for (let photo of pluck(state.photos, item.photos)) {
          let src = Cache.url(cache.root, 'full', photo)
          let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
            ...photo
          })

          tf.tidy(() => {
            let tensor = tf.browser.fromPixels({
              data: buffer,
              width: raw.width,
              height: raw.height
            }).div(255)
            let resized = tf.image.resizeBilinear(
              tensor,
              [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
              true)
            let features = mobilenet.predict(resized.expandDims())
            let prediction = model.predict(features).squeeze()

            let highestIndex = prediction.argMax().arraySync()
            let predictionArray = prediction.arraySync()

            let tag = state.tags[highestIndex]
            let confidence = predictionArray[highestIndex]

            if (confidence >= 0.5) {
              taggings[item.id] = [...(taggings[item.id] || []), tag.id]
            }
            console.log('Prediction: ' + tag.name + ' with ' + Math.floor(confidence * 100) + '% confidence')
          })

          for (let [key, value] of Object.entries(taggings)) {
            yield put(act.item.tags.create({ id: [key], tags: uniq(value) }))
          }
        }
      }
    } catch (e) {
      warn({
        stack: e.stack
      }, `failed to train image: ${e.message}`)
      fail(e, this.action.type)
    }
  }
}

Predict.register(ITEM.PREDICT)
