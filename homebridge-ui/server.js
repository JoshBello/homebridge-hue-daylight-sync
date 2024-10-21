const { HomebridgePluginUiServer } = require('@homebridge/plugin-ui-utils');

class UiServer extends HomebridgePluginUiServer {
  constructor() {
    super();
    this.ready();
  }
}

(() => {
  return new UiServer();
})();
