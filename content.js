const port = chrome.runtime.connect({name: "background"});

console.log('Ejecutando content.js');

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if(request.cmd === "scrap"){
      try {
        const products = await scrapAllPages();
        port.postMessage({cmd: "finish-scrap", products});
      } catch (error) {
        port.postMessage({cmd: "error-scrap", error: error.message});
      }
    }
  }
);

async function scrapAllPages() {
  let allProducts = [];
  let currentPage = 1;
  const totalPages = getTotalPages();
  
  function getTotalPages() {
    const paginationItems = document.querySelectorAll('.pagination__item.page-number');
    const lastPage = paginationItems[paginationItems.length - 1]?.textContent;
    return parseInt(lastPage) || 1;
  }

  function scrapeCurrentPage() {
    let cards = document.querySelectorAll('div.showcase-grid>div> .Showcase__content');
    cards = [...cards];
    
    return cards.map(el => {
      const name = el.querySelector('.Showcase__name')?.textContent?.trim();
      const sellerName = el.querySelector('.Showcase__SellerName')?.textContent?.trim();
      const salePrice = el.querySelector('.Showcase__salePrice')?.textContent?.trim();
      return { 
        name, 
        sellerName, 
        salePrice,
        page: currentPage 
      };
    });
  }

  async function goToNextPage() {
    const nextButton = document.querySelector('.pagination__item.page-control.next');
    if (nextButton && !nextButton.classList.contains('disabled')) {
      nextButton.click();
      // Esperar a que la nueva página cargue
      await delay(2000);
      return true;
    }
    return false;
  }

  console.log(`Iniciando scraping. Total de páginas detectadas: ${totalPages}`);
  
  // Enviar progreso inicial
  port.postMessage({
    cmd: "progress-scrap", 
    progress: {
      current: currentPage,
      total: totalPages,
      products: 0
    }
  });

  while (currentPage <= totalPages) {
    console.log(`Scraping página ${currentPage} de ${totalPages}`);
    
    // Obtener productos de la página actual
    const products = scrapeCurrentPage();
    allProducts = [...allProducts, ...products];
    
    // Enviar progreso
    port.postMessage({
      cmd: "progress-scrap", 
      progress: {
        current: currentPage,
        total: totalPages,
        products: allProducts.length
      }
    });

    if (currentPage < totalPages) {
      // Ir a la siguiente página
      const success = await goToNextPage();
      if (!success) {
        console.log('Error al navegar a la siguiente página');
        break;
      }
    }
    
    currentPage++;
  }

  console.log(`Scraping completado. Total de productos encontrados: ${allProducts.length}`);
  return allProducts;
}