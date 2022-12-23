import { Api } from './Api.js'
import { Stream } from './Stream.js'

const SET_TIME = 'SET_TIME'

const clockInitialState = {
  time: new Date(),
}

function clockReducer(state = clockInitialState, action) {
  if (action.type === SET_TIME) {
    return { ...state, time: action.time }
  }

  return state
}

const SET_LOTS = 'SET_LOTS'
const CHANGE_LOT_PRICE = 'CHANGE_LOT_PRICE'

const auctionInitialState = {
  lots: null,
}

function auctionReducer(state = auctionInitialState, action) {
  if (action.type === SET_LOTS) {
    return { ...state, lots: action.lots }
  }

  if (action.type === CHANGE_LOT_PRICE) {
    return {
      ...state,
      lots: state.lots.map(lot => {
        if (lot.id === action.id) {
          return {...lot, price: action.price}
        }

        return lot
      })
    }
  }

  return state
}

function setTime(time) {
  return { type: SET_TIME, time }
}

function setLots(lots) {
  return { type: SET_LOTS, lots }
}

function setLotPrice(id, price) {
  return { type: CHANGE_LOT_PRICE, id, price }
}

class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer
    this.state = reducer(initialState, { type: null })
    this.listeners = []
  }

  subscribe = callback => {
    this.listeners.push(callback)

    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  getState = () => this.state

  // setState = state => {
  //   this.state = typeof state === 'function' ? state(this.state) : state
  //
  //   this.listeners.forEach(listener => listener())
  // }

  dispatch = action => {
    this.state = this.reducer(this.state, action)
    this.listeners.forEach(listener => listener())
  }
}

function combineReducer(reducers) {
  return (state = {}, action) => {
    const result = {}

    Object.entries(reducers).forEach(([key, reducer]) => {
      result[key] = reducer(state[key], action)
    })

    return result
  }
}

const store = new Store(combineReducer({
  clock  : clockReducer,
  auction: auctionReducer,
}))

renderView(store.getState())

function createElement(type, props = {}, ...children) {
  const key = props.key || null

  props.children = children.length === 1 ? children[0] : children

  return { type, key, props }
}

function App({ state }) {
  return createElement('div', { className: 'app' }, [
    createElement(Header),
    createElement(Clock, { time: state.clock.time }),
    createElement(Lots, { lots: state.auction.lots }),
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
  return createElement('article', { className: 'lot' + (lot.favorite ? ' favorite' : ''), key }, [
    createElement('div', { className: 'price' }, lot.price),
    createElement('h1', {}, lot.name),
    createElement('p', {}, lot.description),
    createElement(Favorite, { lot }),
  ])
}

function Favorite({ lot }) {
  return createElement('button', {}, lot.favorite ? 'Unfavorite' : 'Favorite')
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

setInterval(() => {
  store.dispatch(setTime(new Date()))
}, 1000)

Api.get('/lots').then(lots => {
  store.dispatch(setLots(lots))

  lots.forEach(lot => Stream.subscribe(`price-${lot.id}`, ({ id, price }) => {
    store.dispatch(setLotPrice(id, price))
  }))
})
