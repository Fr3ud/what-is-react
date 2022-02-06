import { Api } from './Api.js'
import { Stream } from './Stream.js'

let state = {
  time: new Date(),
  lots: null,
}

renderView(state)

function App(state) {
  return {
    type    : 'div',
    props   : {
      className: 'app',
      children : [
        { type : Header,
          props: {},
        },
        {
          type : Clock,
          props: { time: state.time },
        },
        {
          type : Lots,
          props: { lots: state.lots },
        }
      ],
    },
  }
}

function Header() {
  return {
    type    : 'header',
    props   : {
      className: 'header',
      children : [
        {
          type : Logo,
          props: {},
        }
      ],
    },
  }
}

function Logo() {
  return {
    type : 'img',
    props: {
      className: 'logo',
      src      : 'pinecone-logo.png',
      alt      : 'pinecone logo',
    }
  }
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21

  return {
    type : 'div',
    props: {
      className: 'clock',
      children : [
        {
          type : 'span',
          props: {
            className: 'value',
            children : [
              time.toLocaleString()
            ],
          },
        },
        {
          type : 'span',
          props: {
            className: isDay ? 'icon day' : 'icon night',
          },
        },
      ],
    },
  }
}

function Loading() {
  const element = document.createElement('div')
  element.className = 'loading'
  element.innerText = 'Loading...'

  return element
}

function Lots({ lots }) {
  if (!lots) {
    return Loading()
  }

  const list = document.createElement('div')
  list.className = 'list'

  lots.forEach(lot => list.append(Lot(lot)))

  return list
}

function Lot(lot) {
  const node = document.createElement('article')
  node.className = 'lot'
  node.data.key = lot.id

  const price = document.createElement('div')
  price.className = 'price'
  price.innerText = lot.price
  node.append(price)

  const name = document.createElement('h1')
  name.innerText = lot.name
  node.append(name)

  const description = document.createElement('p')
  description.innerText = lot.description
  node.append(description)

  return node
}

function render(virtualDOM, realDOMRoot) {
  const virtualDOMRoot = document.createElement(realDOMRoot.tagName)
  virtualDOMRoot.id = realDOMRoot.id
  virtualDOMRoot.append(virtualDOM)

  sync(realDOMRoot, virtualDOMRoot)
}

function sync(realNode, virtualNode) {
  // Sync element
  if (realNode.id !== virtualNode.id) {
    realNode.id = virtualNode.id
  }

  if (realNode.className !== virtualNode.className) {
    realNode.className = virtualNode.className
  }

  if (virtualNode.attributes) {
    Array.from(virtualNode.attributes)
      .forEach(attr => realNode[attr.name] = attr.value)
  }

  // Sync text nodes
  if (realNode.nodeValue !== virtualNode.nodeValue) {
    realNode.nodeValue = virtualNode.nodeValue
  }

  // Sync child nodes
  const virtualChildNodes = virtualNode.childNodes
  const realChildNodes = realNode.childNodes

  for (let i = 0; i < virtualChildNodes.length || i < realChildNodes.length; i++) {
    const vNode = virtualChildNodes[i]
    const rNode = realChildNodes[i]

    // Remove
    if (!vNode && rNode) {
      realNode.remove(rNode)
    }

    // Update
    if (vNode && rNode && vNode.tagName === rNode.tagName) {
      sync(rNode, vNode)
    }

    // Replace
    if (vNode && rNode && vNode.tagName !== rNode.tagName) {
      const newRealNode = createRealNodeByVirtual(vNode)

      sync(newRealNode, vNode)
      realNode.replaceChild(newRealNode, rNode)
    }

    // Add
    if (vNode && !rNode) {
      const newRealNode = createRealNodeByVirtual(vNode)

      sync(newRealNode, vNode)
      realNode.appendChild(newRealNode)
    }
  }
}

function createRealNodeByVirtual(virtualNode) {
  return virtualNode.nodeType === Node.TEXT_NODE
    ? document.createTextNode('')
    : document.createElement(virtualNode.tagName)
}

function renderView(state) {
  render(App(state), document.getElementById('root'))
}

setInterval(() => {
  state = {
    ...state,
    time: new Date()
  }

  renderView(state)
}, 1000)

Api.get('/lots').then(lots => {
  state = { ...state, lots }

  renderView(state)

  const onPrice = data => {
    state = {
      ...state,
      lots: state.lots.map(lot => {
        if (lot.id === data.id) {
          return {
            ...lot,
            price: data.price,
          }
        }

        return lot
      })
    }

    renderView(state)
  }

  lots.forEach(lot => Stream.subscribe(`price-${lot.id}`, onPrice))
})
