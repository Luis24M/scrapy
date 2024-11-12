const buttonScrapt = document.getElementById('scrapea');
const buttonProduct = document.getElementById('product');

const port = chrome.runtime.connect({name: "background"});

buttonScrapt.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  
  if (tab && tab.id) {
    const response = await chrome.tabs.sendMessage(tab.id, {cmd: "scrap"});
  } else {
    console.error("No active tab found.");
  }
});

buttonProduct.addEventListener('click', async () => {
  port.postMessage({cmd: "get-products"});
});

port.onMessage.addListener(function(msg) {
  if (msg.cmd === "result-products") {
    const {result} = msg;
    const txtData = document.getElementById('txt-data');
    txtData.innerHTML = JSON.stringify(result, null, 2);
  }
});
