import { Api } from './Api.js'
import { Stream } from './Stream.js'

let state = {
  time: new Date(),
  lots: null,
}

renderView(state)

function App(state) {
  const app = document.createElement('div')

  app.className = 'app'
  app.append(Header())
  app.append(Clock({ time: state.time }))
  app.append(Lots({ lots: state.lots }))

  return app
}

function Header() {
  const header = document.createElement('div')

  header.className = 'header'
  header.append(Logo())

  return header
}

function Logo() {
  const logo = document.createElement('img')

  logo.className = 'logo'
  logo.src = 'pinecone-logo.png'
  logo.alt = 'pinecone logo'

  return logo
}

function Clock({ time }) {
  const clock = document.createElement('div')
  clock.className = 'clock'

  const value = document.createElement('span')
  value.className = 'value'
  value.innerText = time.toLocaleTimeString()

  clock.append(value)

  const icon = document.createElement('span')

  if (time.getHours() >= 7 && time.getHours() <= 21) {
    icon.className = 'icon day'
  } else {
    icon.className = 'icon night'
  }

  clock.append(icon)

  return clock
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
      .forEach(attr => {
        console.log('virtualNode', virtualNode)
        console.log('realNode', realNode)
        return realNode[attr.name] = attr.value
      })
  }



  // Sync text nodes
  if (realNode.nodeValue !== virtualNode.nodeValue) {
    realNode.nodeValue = virtualNode.nodeValue
  }

  // Clear real node
  realNode.innerHTML = ''

  // Sync child nodes
  const virtualChildNodes = virtualNode.childNodes

  for (let i = 0; i < virtualChildNodes.length; i++) {
    const vNode = virtualChildNodes[i]
    const rNode = vNode.type === Node.TEXT_NODE
      ? document.createTextNode('')
      : document.createElement(vNode.tagName)

    sync(rNode, vNode)

    realNode.appendChild(rNode)
  }
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
}, 10000)

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
