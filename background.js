chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    if (msg.cmd === "finish-scrap"){
      const {products} = msg;
      chrome.storage.local.set({"products": products}).then(() => {
        console.log("Value is set");
      });
    }
    if (msg.cmd === "get-products"){
      chrome.storage.local.get(["products"]).then((result) => {
        port.postMessage({cmd: 'result-products', result});
    });
  }
  });
});
