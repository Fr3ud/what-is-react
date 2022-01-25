const state = {
  time: new Date(),
  lots: [
    {
      id         : 1,
      name       : 'Sugar Pine',
      description: 'The sugar pine is one of the tallest and most-massive pine species, reaching up to 70 meters (230 feet) tall with a trunk diameter of up to 3.5 meters (11.5 feet). The distinctive tree can be found from Oregon through California and northern Mexico, and it gets its name from the sweet resin that crystallizes around wounds in the bark. In addition to being the largest pine, sugar pines produce the longest cones of any species, up to 61 cm (24 inches) long!',
      price      : 42,
    },
    {
      id         : 2,
      name       : 'Bristlecone Pine',
      description: 'The Great Basin bristlecone pine has the longest life span of any non-clonal organism. One individual in eastern Nevada is known to be more than 5,000 years old! The small trees are often scraggly and windblown and get their name from the small bristles on the scales of the female cones. Although obviously not every bristlecone pine tree is ancient, each pinecone serves as a little connection between the species’ amazing history and its future. How cool is that?',
      price      : 42,
    },
    {
      id         : 3,
      name       : 'Monterey Pine',
      description: 'Although the beautiful Monterey pine has a native range of only a few specific regions along the California coast, it is one of the most widely planted timber pines in the world. The cones can persist on the tree for several years, opening and closing repeatedly in response to humidity or fire. Each cone can produce up to 200 seeds! The tree is grown in Australia, New Zealand, Argentina, Chile, Spain, and the United States, among other countries, so holding the cone of a Monterey pine is practically a trip around the world…or something.',
      price      : 42,
    },
  ],
}

const app = App(state)
render(app, document.getElementById('root'))


function App() {
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

function Lots({ lots }) {
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

setInterval(() => {
  const time = new Date()

  const app = document.querySelector('.app')
  const clock = app.querySelector('.clock')

  const newClock = Clock({ time })

  app.replaceChild(newClock, clock)
})

function render(app, root) {
  root.append(app)
}
