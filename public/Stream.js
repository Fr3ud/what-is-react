export const Stream = {
  subscribe(channel, listener) {
    const match = /price-(\d+)/.exec(channel)

    if (match) {
      setInterval(() => {
        listener({
          id   : parseInt(match[1]),
          price: Math.round(Math.random() * 10 + 42),
        })
      }, 400)
    }
  }
}
