import { Api } from './Api.js'
import { Stream } from './Stream.js'

const initialState = {
  time: new Date(),
  lots: null,
}

class Store {
  constructor(initialState) {
    this.state = initialState
    this.listeners = []
  }

  subscribe = callback => {
    this.listeners.push(callback)

    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  getState = () => this.state

  setState = state => {
    this.state = typeof state === 'function' ? state(this.state) : state

    this.listeners.forEach(listener => listener())
  }
}

const store = new Store(initialState)

renderView(store.getState())

function createElement(type, props = {}, ...children) {
  const key = props.key || null

  props.children = children.length === 1 ? children[0] : children

  return { type, key, props }
}

function App({ state }) {
  return createElement('div', { className: 'app' }, [
    createElement(Header),
    createElement(Clock, { time: state.time }),
    createElement(Lots, { lots: state.lots }),
  ])
}

function Header() {
  return createElement('header', { className: 'header' }, createElement(Logo))
}

function Logo() {
  return createElement('img', { className: 'logo', src: 'pinecone-logo.png', alt: 'pinecone logo' })
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21

  return createElement('div', { className: 'clock' }, [
    createElement('span', { className: 'value' }, time.toLocaleString()),
    createElement('span', { className: isDay ? 'icon day' : 'icon night' }),
  ])
}

function Loading() {
  return createElement('div', { className: 'loading' }, 'Loading...')
}

function Lots({ lots }) {
  if (!lots) {
    return createElement(Loading)
  }

  const elements = lots.map(lot => createElement(Lot, { lot, key: lot.id }))

  return createElement('div', { className: 'lots' }, elements)
}

function Lot({ lot, key }) {
  return createElement('article', { className: 'lot', key }, [
    createElement('div', { className: 'price' }, lot.price),
    createElement('h1', {}, lot.name),
    createElement('p', {}, lot.description),
  ])
}

function render(virtualDOM, realDOMRoot) {
  const evaluatedVirtualDOM = evaluate(virtualDOM)

  const virtualDOMRoot = {
    type : realDOMRoot.tagName.toLowerCase(),
    props: {
      id      : realDOMRoot.id,
      children: [evaluatedVirtualDOM],
      ...realDOMRoot.attributes,
    },
  }

  sync(virtualDOMRoot, realDOMRoot)
}

function evaluate(virtualNode) {
  if (typeof virtualNode !== 'object') {
    return virtualNode
  }

  if (typeof virtualNode.type === 'function') {
    return evaluate(virtualNode.type(virtualNode.props))
  }

  const props = virtualNode.props || {}

  return {
    ...virtualNode,
    props: {
      ...props,
      children: Array.isArray(props.children) ? props.children.map(evaluate) : [evaluate(props.children)],
    },
  }
}

function sync(virtualNode, realNode) {
  // Sync element
  if (virtualNode.props) {
    for (const [key, value] of Object.entries(virtualNode.props)) {
      if (key === 'children' || key === 'key') {
        continue
      }

      if (realNode[key] !== value) {
        realNode[key] = value
      }
    }
  }

  if (virtualNode.key) {
    realNode.dataset.key = virtualNode.key
  }

  // Sync text nodes
  if (typeof virtualNode !== 'object' && virtualNode !== realNode.nodeValue) {
    realNode.nodeValue = virtualNode
  }

  // Sync child nodes
  const virtualChildNodes = virtualNode.props ? virtualNode.props.children || [] : []
  const realChildNodes = realNode.childNodes

  for (let i = 0; i < virtualChildNodes.length || i < realChildNodes.length; i++) {
    const vNode = virtualChildNodes[i]
    const rNode = realChildNodes[i]

    // Remove
    if (!vNode && rNode) {
      realNode.remove(rNode)
    }

    // Update
    if (vNode && rNode && vNode.type === rNode.tagName?.toLowerCase()) { // TODO: add error handler
      sync(vNode, rNode)
    }

    // Replace
    if (vNode && rNode && vNode.type !== rNode.tagName?.toLowerCase()) { // TODO: add error handler
      const newRealNode = createRealNodeByVirtual(vNode)

      sync(vNode, newRealNode)
      realNode.replaceChild(newRealNode, rNode)
    }

    // Add
    if (vNode && !rNode) {
      const newRealNode = createRealNodeByVirtual(vNode)

      sync(vNode, newRealNode)
      realNode.appendChild(newRealNode)
    }
  }
}

function createRealNodeByVirtual(virtualNode) {
  return typeof virtualNode === 'object'
    ? document.createElement(virtualNode.type)
    : document.createTextNode('')
}

function renderView(state) {
  render(createElement(App, { state }), document.getElementById('root'))
}

store.subscribe(() => renderView(store.getState()))

function setTime(state, time) {
  return { ...state, time }
}

function setLots(state, lots) {
  return { ...state, lots }
}

function changeLotPrice(state, id, price) {
  return {
    ...state,
    lots: state.lots.map(lot => {
      if (lot.id === id) {
        return {...lot, price}
      }

      return lot
    })
  }
}

setInterval(() => {
  store.setState(state => setTime(state, new Date()))
}, 1000)

Api.get('/lots').then(lots => {
  store.setState(state => setLots(state, lots))

  lots.forEach(lot => Stream.subscribe(`price-${lot.id}`, data => {
    store.setState(state => changeLotPrice(state, data.id, data.price))
  }))
})
