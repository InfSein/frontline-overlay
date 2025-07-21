interface OverlayPluginApiType {
  ready: boolean
  callHandler: (obj: any, cb: any) => void
}

export {}

declare global {
  interface Window {
    OverlayPluginApi?: OverlayPluginApiType;
    __OverlayCallback?: (msg: any) => void;
  }
}