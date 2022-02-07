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
  return {
    type : 'div',
    props: {
      className: 'loading',
      children : ['Loading...'],
    },
  }
}

function Lots({ lots }) {
  if (!lots) {
    return {
      type : Loading,
      props: {},
    }
  }

  return {
    type : 'div',
    props: {
      className: 'lots',
      children : lots.map(lot => ({
        type : Lot,
        props: { lot },
      })),
    },
  }
}

function Lot(lot) {
  return {
    type : 'article',
    key  : lot.id,
    props: {
      className: 'lot',
      children : [
        {
          type : 'div',
          props: {
            className: 'price',
            children : [ lot.price ],
          },
        },
        {
          type : 'h1',
          props: {
            children: [ lot.name ],
          },
        },
        {
          type : 'p',
          props: {
            children: [ lot.description ],
          },
        },
      ],
    },
  }
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

  sync(realDOMRoot, virtualDOMRoot)
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
      // children: props.children.map(evaluate),
      children: Array.isArray(props.children) ? props.children.map(evaluate) : [evaluate(props.children)],
    },
  }
}

function sync(realNode, virtualNode) {
  // Sync element
  if (virtualNode.props) {
    Object.entries(virtualNode.props).forEach(([name, value]) => {
      if (name === 'children' || name === 'key') {
        return
      }

      if (realNode[name] !== value) {
        realNode[name] = value
      }
    })
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
    if (vNode && rNode && (vNode.type || '') === (rNode.tagName || '').toLowerCase()) { // TODO: add error handler
      sync(rNode, vNode)
    }

    // Replace
    if (vNode && rNode && (vNode.type || '') !== (rNode.tagName || '').toLowerCase()) { // TODO: add error handler
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
  console.log('virtual', virtualNode.type)
  return typeof virtualNode === 'object'
    ? document.createElement(virtualNode.type)
    : document.createTextNode('')
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
