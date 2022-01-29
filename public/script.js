import { Api } from './Api.js'

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

function render(app, root) {
  root.innerHTML = ''
  root.append(app)
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
})
