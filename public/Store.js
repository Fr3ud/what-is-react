export class Store {
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
