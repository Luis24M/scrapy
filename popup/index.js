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
    const results = document.getElementById('results');
    results.style.display = 'block';
    results.innerHTML = result.products.map(product => {
      return `
        <div class="card">
          <div class="card-body">
            <h2 class="card-title">Nombre: ${product.name}</h2>
            <h4 class="card-subtitle mb-2 text-muted">Vendedido ${product.sellerName}</h4>
            <p class="card-text">Precio: ${product.salePrice}</p>
          </div>
        </div>
      `;
    }
    ).join('');
  }
});
