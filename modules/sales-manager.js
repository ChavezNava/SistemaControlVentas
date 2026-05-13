// Módulo de Gestión de Ventas - CON MÚLTIPLES PRODUCTOS Y CARRITO
class SalesManager {
  constructor(salesSystem) {
    this.salesSystem = salesSystem;
    this.cart = [];
  }
  
  addToCart() {
    const productId = document.getElementById('productSelect').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const salePrice = parseFloat(document.getElementById('salePrice').value);
    
    if (!productId || !quantity || !salePrice) {
      this.salesSystem.showNotification('Por favor completa todos los campos', 'error');
      return false;
    }
    
    if (quantity <= 0) {
      this.salesSystem.showNotification('La cantidad debe ser mayor a 0', 'error');
      return false;
    }
    
    const product = this.salesSystem.products.find(p => p.id == productId);
    if (!product) {
      this.salesSystem.showNotification('Producto no encontrado', 'error');
      return false;
    }
    
    if (product.stock < quantity) {
      this.salesSystem.showNotification(`Stock insuficiente. Solo hay ${product.stock} unidades`, 'error');
      return false;
    }
    
    const existingItem = this.cart.find(item => item.productId == productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.salePrice;
      existingItem.reinvestment = existingItem.quantity * existingItem.purchasePrice;
      existingItem.profit = existingItem.total - existingItem.reinvestment;
    } else {
      this.cart.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: quantity,
        salePrice: salePrice,
        purchasePrice: product.purchasePrice,
        total: quantity * salePrice,
        reinvestment: quantity * product.purchasePrice,
        profit: quantity * (salePrice - product.purchasePrice)
      });
    }
    
    document.getElementById('saleForm').reset();
    document.getElementById('purchasePrice').value = '';
    this.updateSaleSummary();
    this.renderCart();
    this.updateCartTotals();
    
    this.salesSystem.showNotification(`${quantity} ${product.name} agregado al carrito`, 'success');
    return true;
  }
  
  renderCart() {
    const container = document.getElementById('shoppingCart');
    if (!container) return;
    
    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="text-center empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Carrito vacío</p>
          <small>Agrega productos para continuar</small>
        </div>
      `;
      document.getElementById('cartCount').textContent = '0 items';
      return;
    }
    
    document.getElementById('cartCount').textContent = `${this.cart.length} items`;
    
    container.innerHTML = `
      <div class="cart-items">
        ${this.cart.map((item, index) => {
          const category = this.salesSystem.getCategoryInfo(item.category);
          return `
            <div class="cart-item" data-index="${index}">
              <div class="cart-item-info">
                <div class="cart-item-name">
                  <span class="category-badge" style="background: ${category.color}">
                    ${category.name}
                  </span>
                  ${item.productName}
                </div>
                <div class="cart-item-details">
                  <span>${item.quantity} x $${item.salePrice.toFixed(2)}</span>
                  <span class="cart-item-total">$${item.total.toFixed(2)}</span>
                </div>
                <div class="cart-item-subdetails">
                  <span class="text-warning">Reinversión: $${item.reinvestment.toFixed(2)}</span>
                  <span class="text-success">Ganancia: $${item.profit.toFixed(2)}</span>
                </div>
              </div>
              <div class="cart-item-actions">
                <button class="btn btn-small btn-warning" onclick="window.salesSystem.salesManager.updateCartItemQuantity(${index}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
                  <i class="fas fa-minus"></i>
                </button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="btn btn-small btn-warning" onclick="window.salesSystem.salesManager.updateCartItemQuantity(${index}, ${item.quantity + 1})">
                  <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="window.salesSystem.salesManager.removeFromCart(${index})">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  updateCartItemQuantity(index, newQuantity) {
    if (newQuantity <= 0) {
      this.removeFromCart(index);
      return;
    }
    
    const item = this.cart[index];
    if (!item) return;
    
    const product = this.salesSystem.products.find(p => p.id == item.productId);
    if (product && product.stock < (newQuantity - item.quantity)) {
      this.salesSystem.showNotification(`Stock insuficiente. Solo hay ${product.stock} unidades`, 'error');
      return;
    }
    
    item.quantity = newQuantity;
    item.total = item.quantity * item.salePrice;
    item.reinvestment = item.quantity * item.purchasePrice;
    item.profit = item.total - item.reinvestment;
    
    this.renderCart();
    this.updateCartTotals();
  }
  
  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.renderCart();
    this.updateCartTotals();
    this.salesSystem.showNotification('Producto eliminado del carrito', 'info');
  }
  
  updateCartTotals() {
    const totalAmount = this.cart.reduce((sum, item) => sum + item.total, 0);
    const totalReinvestment = this.cart.reduce((sum, item) => sum + item.reinvestment, 0);
    const totalProfit = totalAmount - totalReinvestment;
    
    const totalAmountEl = document.getElementById('cartTotalAmount');
    const totalReinvestmentEl = document.getElementById('cartTotalReinvestment');
    const totalProfitEl = document.getElementById('cartTotalProfit');
    const confirmBtn = document.getElementById('confirmSaleBtn');
    
    if (totalAmountEl) totalAmountEl.textContent = `$${totalAmount.toFixed(2)}`;
    if (totalReinvestmentEl) totalReinvestmentEl.textContent = `$${totalReinvestment.toFixed(2)}`;
    if (totalProfitEl) totalProfitEl.textContent = `$${totalProfit.toFixed(2)}`;
    
    if (confirmBtn) {
      confirmBtn.disabled = this.cart.length === 0;
    }
  }
  
  clearCart() {
    if (this.cart.length === 0) return;
    
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
      this.cart = [];
      this.renderCart();
      this.updateCartTotals();
      this.salesSystem.showNotification('Carrito vaciado', 'info');
    }
  }
  
  confirmSale() {
    if (this.cart.length === 0) {
      this.salesSystem.showNotification('El carrito está vacío', 'error');
      return;
    }
    
    this.showSaleConfirmationModal();
  }
  
  showSaleConfirmationModal() {
    const totalAmount = this.cart.reduce((sum, item) => sum + item.total, 0);
    const totalReinvestment = this.cart.reduce((sum, item) => sum + item.reinvestment, 0);
    const totalProfit = totalAmount - totalReinvestment;
    
    const modalHTML = `
      <div id="saleConfirmModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h3>
              <i class="fas fa-check-circle"></i>
              Confirmar Venta
            </h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="cart-summary-confirm">
              <h4>Resumen de la venta</h4>
              ${this.cart.map(item => `
                <div class="confirm-item">
                  <span>${item.quantity} x ${item.productName}</span>
                  <span>$${item.total.toFixed(2)}</span>
                </div>
              `).join('')}
              <div class="confirm-totals">
                <div class="confirm-total"><strong>Total Venta:</strong> <span>$${totalAmount.toFixed(2)}</span></div>
                <div class="confirm-reinvestment"><strong>Reinversión:</strong> <span>$${totalReinvestment.toFixed(2)}</span></div>
                <div class="confirm-profit"><strong>Ganancia:</strong> <span class="text-success">$${totalProfit.toFixed(2)}</span></div>
              </div>
            </div>
            
            <div class="form-actions mt-3">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button type="button" class="btn btn-success" id="finalConfirmSaleBtn">
                <i class="fas fa-check"></i> Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const existingModal = document.getElementById('saleConfirmModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('saleConfirmModal');
    const confirmBtn = document.getElementById('finalConfirmSaleBtn');
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        modal.remove();
        this.processSale();
      });
    }
    
    modal.classList.remove('hidden');
  }
  
  processSale() {
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of this.cart) {
      const product = this.salesSystem.products.find(p => p.id == item.productId);
      
      if (!product) {
        errorCount++;
        continue;
      }
      
      if (product.stock < item.quantity) {
        this.salesSystem.showNotification(`Stock insuficiente para ${product.name}`, 'error');
        errorCount++;
        continue;
      }
      
      const sale = {
        id: Date.now() + Math.random(),
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: item.quantity,
        salePrice: item.salePrice,
        purchasePrice: product.purchasePrice,
        timestamp: new Date().toISOString(),
        date: this.salesSystem.currentDate
      };
      
      product.stock -= item.quantity;
      this.salesSystem.sales.push(sale);
      successCount++;
    }
    
    this.salesSystem.dataManager.saveProducts(this.salesSystem.products);
    this.salesSystem.dataManager.saveSales(this.salesSystem.sales);
    
    this.salesSystem.productManager.renderProducts();
    this.salesSystem.productManager.renderProductSelect();
    this.renderTodaySales();
    this.salesSystem.updateSummary();
    
    this.cart = [];
    this.renderCart();
    this.updateCartTotals();
    
    document.getElementById('saleForm').reset();
    document.getElementById('purchasePrice').value = '';
    this.updateSaleSummary();
    
    this.salesSystem.historyManager.loadHistory();
    this.salesSystem.historyManager.updateManagementStats();
    this.salesSystem.historyManager.renderRecentSales();
    
    this.salesSystem.showNotification(`${successCount} venta(s) registrada(s) exitosamente`, 'success');
  }
  
  onProductSelectChange(productId) {
    const product = this.salesSystem.products.find(p => p.id == productId);
    if (product) {
      document.getElementById('purchasePrice').value = product.purchasePrice;
      document.getElementById('salePrice').value = product.salePrice;
      this.updateSaleSummary();
    } else {
      document.getElementById('purchasePrice').value = '';
      document.getElementById('salePrice').value = '';
    }
  }
  
  updateSaleSummary() {
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const salePrice = parseFloat(document.getElementById('salePrice').value) || 0;
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    
    const totalSale = quantity * salePrice;
    const totalReinvestment = quantity * purchasePrice;
    const totalProfit = totalSale - totalReinvestment;
    
    document.getElementById('saleTotal').textContent = `$${totalSale.toFixed(2)}`;
    document.getElementById('saleReinvestment').textContent = `$${totalReinvestment.toFixed(2)}`;
    document.getElementById('saleProfit').textContent = `$${totalProfit.toFixed(2)}`;
  }
  
  renderTodaySales() {
    const container = document.getElementById('todaySales');
    const todaySales = this.salesSystem.sales.filter(sale => sale.date === this.salesSystem.currentDate);
    
    document.getElementById('todaySalesCount').textContent = `Hoy: ${todaySales.length}`;
    
    if (todaySales.length === 0) {
      container.innerHTML = '<div class="text-center">No hay ventas registradas hoy</div>';
      return;
    }
    
    container.innerHTML = todaySales.map(sale => {
      const total = sale.quantity * sale.salePrice;
      const reinvestment = sale.quantity * sale.purchasePrice;
      const profit = total - reinvestment;
      const category = this.salesSystem.getCategoryInfo(sale.category);
      
      return `
        <div class="sale-item">
          <div class="sale-info">
            <div class="sale-product">
              <span class="category-badge" style="background: ${category.color}; margin-right: 0.5rem; padding: 0.1rem 0.5rem;">
                ${category.name}
              </span>
              ${sale.productName}
            </div>
            <div class="sale-details">
              ${sale.quantity} x $${sale.salePrice.toFixed(2)} | 
              ${new Date(sale.timestamp).toLocaleTimeString('es-ES')}
            </div>
          </div>
          <div class="sale-amounts">
            <div class="sale-amount">$${total.toFixed(2)}</div>
            <div class="sale-reinvestment text-warning">$${reinvestment.toFixed(2)}</div>
            <div class="sale-profit text-success">+$${profit.toFixed(2)}</div>
          </div>
          <button class="btn btn-small btn-danger" onclick="window.salesSystem.deleteSale(${sale.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  }
}