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

  async function goToPage(pageNumber) {
    // Buscar el botón de la página específica
    const pageButtons = document.querySelectorAll('.pagination__item.page-number');
    let targetButton = null;

    // Primero intentamos encontrar el botón directo
    for (const button of pageButtons) {
      if (button.textContent.trim() === pageNumber.toString()) {
        targetButton = button;
        break;
      }
    }

    // Si no encontramos el botón (porque está oculto en "..."),
    // necesitamos modificar la URL directamente
    if (!targetButton) {
      // Obtener la URL actual
      let currentUrl = window.location.href;
      // Verificar si ya existe un parámetro de página
      if (currentUrl.includes('page=')) {
        currentUrl = currentUrl.replace(/page=\d+/, `page=${pageNumber}`);
      } else {
        // Agregar el parámetro de página
        const separator = currentUrl.includes('?') ? '&' : '?';
        currentUrl = `${currentUrl}${separator}page=${pageNumber}`;
      }
      // Navegar a la nueva URL
      window.location.href = currentUrl;
      await delay(2000); // Esperar a que cargue la página
      return true;
    }

    // Si encontramos el botón, lo clickeamos
    targetButton.click();
    await delay(2000); // Esperar a que cargue la página
    return true;
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

    currentPage++;
    
    if (currentPage <= totalPages) {
      // Ir a la siguiente página
      const success = await goToPage(currentPage);
      if (!success) {
        console.log(`Error al navegar a la página ${currentPage}`);
        break;
      }
    }
  }

  console.log(`Scraping completado. Total de productos encontrados: ${allProducts.length}`);
  return allProducts;
}