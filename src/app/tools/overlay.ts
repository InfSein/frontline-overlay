/* eslint-disable @typescript-eslint/no-explicit-any */

import { OverlayEvent } from "@/app/types/overlay"

const useOverlay = () => {
  const wsUrl = /[\?&]OVERLAY_WS=([^&]+)/.exec(location.href)
  let ws : WebSocket | undefined
  let queue : any[] | null = []
  let rseqCounter = 0
  const responsePromises : any = {}
  const subscribers : any = {}
  let eventsStarted = false
  let sendMessage : (obj: any, cb?: any) => void

  if (wsUrl) {
    sendMessage = (obj: any) => {
      if (queue) queue.push(obj)
      else ws!.send(JSON.stringify(obj))
    }

    function connectWs() {
      ws = new WebSocket(wsUrl![1])

      ws.addEventListener('error', (e) => {
        console.error(e)
      })

      ws.addEventListener('open', () => {
        console.log('Connected!')

        const q = queue ?? []
        queue = null

        for (const msg of q) sendMessage(msg)
      })

      ws.addEventListener('message', (msg : any) => {
        try {
          msg = JSON.parse(msg.data)
        } catch {
          console.error('Invalid message received: ', msg)
          return
        }

        if (msg.rseq !== undefined && responsePromises[msg.rseq]) {
          responsePromises[msg.rseq](msg)
          delete responsePromises[msg.rseq]
        } else {
          processEvent(msg)
        }
      })

      ws.addEventListener('close', () => {
        queue = []

        console.log('Trying to reconnect...')
        // Don't spam the server with retries.
        setTimeout(() => {
          connectWs()
        }, 300)
      })
    }

    connectWs()
  } else {
    sendMessage = (obj : any, cb : any = undefined) => {
      if (queue)
        queue.push([obj, cb])
      else
        window.OverlayPluginApi!.callHandler(JSON.stringify(obj), cb)
    }

    function waitForApi() {
      if (!window.OverlayPluginApi || !window.OverlayPluginApi.ready) {
        setTimeout(waitForApi, 300)
        return
      }

      const q = queue ?? []
      queue = null

      window.__OverlayCallback = processEvent

      for (const [msg, resolve] of q)
        sendMessage(msg, resolve)
    }

    waitForApi()
  }

  function processEvent(msg: any) {
    if (subscribers[msg.type]) {
      for (const sub of subscribers[msg.type])
        sub(msg)
    }
  }

  const addOverlayListener = (event: OverlayEvent, cb: any) => {
    if (eventsStarted && subscribers[event]) {
      console.warn(`A new listener for ${event} has been registered after event transmission has already begun.`)
    }

    if (!subscribers[event]) {
      subscribers[event] = []
    }

    subscribers[event].push(cb)
  }

  const removeOverlayListener = (event: OverlayEvent, cb: any) => {
    if (subscribers[event]) {
      const list = subscribers[event]
      const pos = list.indexOf(cb)

      if (pos > -1) list.splice(pos, 1)
    }
  }

  const callOverlayHandler = (msg: any) => {
    let p

    if (ws) {
      msg.rseq = rseqCounter++
      p = new Promise((resolve) => {
        responsePromises[msg.rseq] = resolve
      })

      sendMessage(msg)
    } else {
      p = new Promise((resolve) => {
        sendMessage(msg, (data: any) => {
          resolve(data == null ? null : JSON.parse(data))
        })
      })
    }

    return p
  }

  const startOverlayEvents = () => {
    eventsStarted = false

    sendMessage({
      call: 'subscribe',
      events: Object.keys(subscribers),
    })
  }

  return {
    addOverlayListener,
    removeOverlayListener,
    callOverlayHandler,
    startOverlayEvents,
  }
}

export default useOverlay;
