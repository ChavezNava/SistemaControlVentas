// Módulo de Gestión de Productos - CORREGIDO
class ProductManager {
  constructor(salesSystem) {
    this.salesSystem = salesSystem;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  getCategoryInfo(categoryId) {
    return this.salesSystem.getCategoryInfo(categoryId);
  }
  
  getCategoryName(categoryId) {
    return this.salesSystem.getCategoryName(categoryId);
  }
  
  renderProducts() {
    const activeCategory = this.getActiveProductCategory();
    let productsToShow = [];
    
    if (activeCategory === 'all') {
      productsToShow = this.salesSystem.products;
    } else {
      productsToShow = this.salesSystem.getProductsByCategory(activeCategory);
    }
    
    const activeGrid = document.querySelector('.product-grid.active');
    if (activeGrid) {
      if (productsToShow.length === 0) {
        activeGrid.innerHTML = '<div class="text-center">No hay productos en esta categoría</div>';
      } else {
        activeGrid.innerHTML = productsToShow.map(product => {
          const category = this.getCategoryInfo(product.category);
          return `
            <div class="product-card" onclick="window.salesSystem.selectProduct(${product.id})" data-product-id="${product.id}">
              <div class="product-name">${this.escapeHtml(product.name)}</div>
              <div class="product-price">$${product.salePrice.toFixed(2)}</div>
              <div class="product-stock ${product.stock < 10 ? 'stock-low' : 'stock-ok'}">Stock: ${product.stock}</div>
              <div class="category-badge" style="background: ${category.color}">${category.name}</div>
            </div>
          `;
        }).join('');
      }
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  renderProductSelect() {
    const select = document.getElementById('productSelect');
    const manualSelect = document.getElementById('manualProductSelect');
    
    const createOptions = () => {
      if (!this.salesSystem.products || this.salesSystem.products.length === 0) {
        return '<option value="">No hay productos disponibles</option>';
      }
      return '<option value="">Selecciona un producto</option>' +
        this.salesSystem.products.map(product => {
          const category = this.getCategoryInfo(product.category);
          return `<option value="${product.id}">${this.escapeHtml(product.name)} - $${product.salePrice.toFixed(2)} (${category.name})</option>`;
        }).join('');
    };
    
    if (select) select.innerHTML = createOptions();
    if (manualSelect) manualSelect.innerHTML = createOptions();
  }
  
  renderInventory() {
    const container = document.getElementById('productsInventory');
    if (!container) return;
    
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      container.innerHTML = `
        <div class="inventory-list">
          ${this.salesSystem.products.map(product => {
            const category = this.getCategoryInfo(product.category);
            return `
              <div class="inventory-item" data-category="${product.category}">
                <div class="inventory-item-header">
                  <div class="inventory-item-name">${this.escapeHtml(product.name)}</div>
                  <div class="inventory-item-category" style="color: ${category.color}">${category.name}</div>
                </div>
                <div class="inventory-item-details">
                  <div class="inventory-item-price">
                    <span>Compra: $${product.purchasePrice.toFixed(2)}</span>
                    <span>Venta: $${product.salePrice.toFixed(2)}</span>
                  </div>
                  <div class="inventory-item-stock ${product.stock < 10 ? 'stock-low' : 'stock-ok'}">Stock: ${product.stock}</div>
                </div>
                <div class="inventory-item-actions">
                  <button class="btn btn-small btn-info" onclick="window.salesSystem.editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-small btn-danger" onclick="window.salesSystem.deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <table class="table">
          <thead><tr><th>Producto</th><th>Categoría</th><th>Precio Compra</th><th>Precio Venta</th><th>Stock</th><th>Acciones</th></tr></thead>
          <tbody>
            ${this.salesSystem.products.map(product => {
              const category = this.getCategoryInfo(product.category);
              return `
                <tr data-category="${product.category}">
                  <td>${this.escapeHtml(product.name)}</td>
                  <td><span class="category-badge" style="background: ${category.color}">${category.name}</span></td>
                  <td>$${product.purchasePrice.toFixed(2)}</td>
                  <td>$${product.salePrice.toFixed(2)}</td>
                  <td class="${product.stock < 10 ? 'text-danger' : 'text-success'}">${product.stock}</td>
                  <td>
                    <button class="btn btn-small btn-info" onclick="window.salesSystem.editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-small btn-danger" onclick="window.salesSystem.deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }
  
  filterProducts(searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const activeCategory = this.getActiveProductCategory();
    
    let productsToFilter = [];
    if (activeCategory === 'all') {
      productsToFilter = this.salesSystem.products;
    } else {
      productsToFilter = this.salesSystem.getProductsByCategory(activeCategory);
    }
    
    const filteredProducts = productsToFilter.filter(product => product.name.toLowerCase().includes(searchLower));
    
    const activeGrid = document.querySelector('.product-grid.active');
    if (activeGrid) {
      if (filteredProducts.length === 0) {
        activeGrid.innerHTML = '<div class="text-center">No se encontraron productos</div>';
      } else {
        activeGrid.innerHTML = filteredProducts.map(product => {
          const category = this.getCategoryInfo(product.category);
          return `
            <div class="product-card" onclick="window.salesSystem.selectProduct(${product.id})">
              <div class="product-name">${this.escapeHtml(product.name)}</div>
              <div class="product-price">$${product.salePrice.toFixed(2)}</div>
              <div class="product-stock ${product.stock < 10 ? 'stock-low' : 'stock-ok'}">Stock: ${product.stock}</div>
              <div class="category-badge" style="background: ${category.color}">${category.name}</div>
            </div>
          `;
        }).join('');
      }
    }
  }
  
  getActiveProductCategory() {
    const activeTab = document.querySelector('[data-category].active');
    return activeTab ? activeTab.getAttribute('data-category') : 'all';
  }
  
  filterInventory(searchTerm = '') {
    const searchLower = searchTerm.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter') ? document.getElementById('categoryFilter').value : 'all';
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      const items = document.querySelectorAll('.inventory-item');
      items.forEach(item => {
        const productName = item.querySelector('.inventory-item-name')?.textContent.toLowerCase() || '';
        const productCategory = item.getAttribute('data-category');
        const matchesSearch = productName.includes(searchLower);
        const matchesCategory = categoryFilter === 'all' || productCategory === categoryFilter;
        item.style.display = matchesSearch && matchesCategory ? '' : 'none';
      });
    } else {
      const rows = document.querySelectorAll('#productsInventory tbody tr');
      rows.forEach(row => {
        const productName = row.cells[0]?.textContent.toLowerCase() || '';
        const productCategory = row.getAttribute('data-category');
        const matchesSearch = productName.includes(searchLower);
        const matchesCategory = categoryFilter === 'all' || productCategory === categoryFilter;
        row.style.display = matchesSearch && matchesCategory ? '' : 'none';
      });
    }
  }
  
  showAddProductModal() {
    const modalTitle = document.getElementById('modalTitle');
    const productForm = document.getElementById('productForm');
    const editProductId = document.getElementById('editProductId');
    
    if (modalTitle) modalTitle.textContent = 'Agregar Nuevo Producto';
    if (productForm) productForm.reset();
    if (editProductId) editProductId.value = '';
    
    this.populateCategorySelect();
    
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('hidden');
    
    if (this.isMobile) {
      setTimeout(() => {
        const productName = document.getElementById('productName');
        if (productName) productName.focus();
      }, 300);
    }
  }
  
  populateCategorySelect() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;
    
    categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    this.salesSystem.getAllCategories().forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }
  
  editProduct(productId) {
    const product = this.salesSystem.products.find(p => p.id === productId);
    if (product) {
      const modalTitle = document.getElementById('modalTitle');
      const editProductId = document.getElementById('editProductId');
      const productName = document.getElementById('productName');
      const productStock = document.getElementById('productStock');
      const productPurchasePrice = document.getElementById('productPurchasePrice');
      const productSalePrice = document.getElementById('productSalePrice');
      
      if (modalTitle) modalTitle.textContent = 'Editar Producto';
      if (editProductId) editProductId.value = product.id;
      if (productName) productName.value = product.name;
      if (productStock) productStock.value = product.stock;
      if (productPurchasePrice) productPurchasePrice.value = product.purchasePrice;
      if (productSalePrice) productSalePrice.value = product.salePrice;
      
      this.populateCategorySelect();
      const categorySelect = document.getElementById('productCategory');
      if (categorySelect) categorySelect.value = product.category;
      
      const modal = document.getElementById('productModal');
      if (modal) modal.classList.remove('hidden');
    }
  }
  
  closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('hidden');
  }
  
  saveProduct() {
    const id = document.getElementById('editProductId')?.value;
    const name = document.getElementById('productName')?.value.trim();
    const category = document.getElementById('productCategory')?.value;
    const stock = parseInt(document.getElementById('productStock')?.value) || 0;
    const purchasePrice = parseFloat(document.getElementById('productPurchasePrice')?.value);
    const salePrice = parseFloat(document.getElementById('productSalePrice')?.value);
    
    if (!name || !category || !purchasePrice || !salePrice) {
      this.salesSystem.showNotification('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    if (purchasePrice >= salePrice) {
      this.salesSystem.showNotification('El precio de venta debe ser mayor al precio de compra', 'error');
      return;
    }
    
    const categoryExists = this.salesSystem.categories.some(c => c.id === category);
    if (!categoryExists) {
      this.salesSystem.showNotification('La categoría seleccionada no existe', 'error');
      return;
    }
    
    if (id) {
      const productIndex = this.salesSystem.products.findIndex(p => p.id == id);
      if (productIndex !== -1) {
        this.salesSystem.products[productIndex] = {
          ...this.salesSystem.products[productIndex],
          name, category, stock, purchasePrice, salePrice
        };
        this.salesSystem.showNotification('Producto actualizado correctamente', 'success');
      }
    } else {
      const newProduct = {
        id: this.salesSystem.dataManager.getNextProductId(this.salesSystem.products),
        name, category, stock, purchasePrice, salePrice
      };
      this.salesSystem.products.push(newProduct);
      this.salesSystem.showNotification('Producto agregado correctamente', 'success');
    }
    
    this.salesSystem.dataManager.saveProducts(this.salesSystem.products);
    this.renderProducts();
    this.renderProductSelect();
    this.renderInventory();
    this.closeProductModal();
    this.salesSystem.updateManagementStats();
  }
  
  deleteProduct(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      const hasSales = this.salesSystem.sales.some(sale => sale.productId === productId);
      if (hasSales) {
        this.salesSystem.showNotification('No se puede eliminar el producto porque tiene ventas asociadas', 'error');
        return;
      }
      
      this.salesSystem.products = this.salesSystem.products.filter(p => p.id !== productId);
      this.salesSystem.dataManager.saveProducts(this.salesSystem.products);
      this.renderProducts();
      this.renderProductSelect();
      this.renderInventory();
      this.salesSystem.showNotification('Producto eliminado correctamente', 'success');
      this.salesSystem.updateManagementStats();
    }
  }
}