const port = chrome.runtime.connect({name: "background"});

console.log('Ejecutando content.js');

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.cmd === "scrap"){
      const products = scrappingProducts();
      port.postMessage({cmd: "finish-scrap", products});
    }
  }
)

function scrappingProducts(){
  let cards = document.querySelectorAll('div.showcase-grid>div> .Showcase__content');
  cards = [...cards];
  
  const products = cards.map(el => {
    const name = el.querySelector('.Showcase__name')?.textContent
    const sellerName = el.querySelector('.Showcase__SellerName')?.textContent
    const salePrice = el.querySelector('.Showcase__salePrice')?.textContent
    return { name, sellerName, salePrice }
  });
  console.log(products)
  return products;
}

port.onMessage.addListener(function(msg) {
});