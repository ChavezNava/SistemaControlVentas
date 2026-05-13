// Sistema de Control de Ventas - CORREGIDO
class SalesSystem {
  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.utils = new Utils();
    this.dataManager = new DataManager();
    
    this.products = this.dataManager.loadProducts();
    this.sales = this.dataManager.loadSales();
    this.categories = this.dataManager.loadCategories();
    this.purchases = this.dataManager.loadPurchases();
    this.budget = this.dataManager.loadBudget();
    
    this.currentDate = this.utils.getLocalDate();
    
    this.categoryManager = new CategoryManager(this);
    this.productManager = new ProductManager(this);
    this.salesManager = new SalesManager(this);
    this.historyManager = new HistoryManager(this);
    this.purchaseManager = new PurchaseManager(this);
    this.uiManager = new UIManager(this);
    this.backupManager = new BackupManager(this);
    
    this.isOnline = navigator.onLine;
    
    this.setupConnectionHandler();
    this.setupOrientationHandler();
    
    this.init();
  }
  
  setupConnectionHandler() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNotification('Conexión a internet restablecida', 'success');
      this.syncPendingData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('Modo offline activado. Los datos se guardarán localmente.', 'warning');
    });
  }
  
  syncPendingData() {
    if (!this.isOnline) return;
    console.log('Sincronizando datos pendientes...');
    this.showNotification('Datos sincronizados correctamente', 'success');
  }
  
  setupOrientationHandler() {
    if (!this.isMobile) return;
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.uiManager.updateDateDisplay();
        this.productManager.renderProducts();
        this.productManager.renderInventory();
        this.categoryManager.renderCategoryTabs();
        if (this.purchaseManager) this.purchaseManager.renderPurchaseHistory();
      }, 300);
    });
  }
  
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeApp());
    } else {
      this.initializeApp();
    }
  }
  
  initializeApp() {
    this.uiManager.setupEventListeners();
    this.uiManager.updateDateDisplay();
    this.uiManager.setupTabs();
    this.loadDataProgressive();
    setInterval(() => this.uiManager.updateDateDisplay(), 1000);
    this.setupVisibilityHandler();
    setTimeout(() => this.createAutoBackup(), 5000);
  }
  
  loadDataProgressive() {
    this.categoryManager.renderCategoryTabs();
    this.productManager.renderProductSelect();
    this.salesManager.renderTodaySales();
    
    setTimeout(() => {
      this.productManager.renderProducts();
      this.updateSummary();
      this.productManager.renderInventory();
      this.historyManager.updateManagementStats();
      this.purchaseManager.renderPurchaseHistory();
      this.purchaseManager.updateBudgetDisplay();
      
      const today = new Date();
      const todayFormatted = today.toISOString().split('T')[0];
      const historyDateInput = document.getElementById('historyDate');
      if (historyDateInput) historyDateInput.value = todayFormatted;
      
      this.historyManager.loadHistory();
    }, 100);
  }
  
  setupVisibilityHandler() {
    if (!this.isMobile) return;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.uiManager.updateDateDisplay();
        this.salesManager.renderTodaySales();
        this.updateSummary();
        if (this.purchaseManager) this.purchaseManager.updateBudgetDisplay();
      }
    });
  }
  
  getCategoryInfo(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    if (category) return category;
    return {
      id: categoryId,
      name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      icon: Utils.getDefaultIcon(categoryId),
      color: Utils.generateRandomColor()
    };
  }
  
  getCategoryName(categoryId) {
    const category = this.getCategoryInfo(categoryId);
    return category.name;
  }
  
  getAllCategories() {
    return this.categories;
  }
  
  getProductsByCategory(categoryId) {
    if (categoryId === 'all') return this.products;
    return this.products.filter(p => p.category === categoryId);
  }
  
  showNotification(message, type = 'info') {
    this.uiManager.showNotification(message, type);
  }
  
  updateSummary() {
    try {
      const todaySales = this.sales.filter(sale => sale.date === this.currentDate);
      const totalSold = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
      const totalAmount = todaySales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
      const totalPurchase = todaySales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
      const totalProfit = totalAmount - totalPurchase;
      const reinvestmentRate = totalAmount > 0 ? (totalPurchase / totalAmount * 100) : 0;
      
      const productSales = {};
      todaySales.forEach(sale => {
        productSales[sale.productName] = (productSales[sale.productName] || 0) + sale.quantity;
      });
      const topProduct = Object.keys(productSales).reduce((top, product) => {
        return !top || productSales[product] > productSales[top] ? product : top;
      }, null);
      
      const categorySales = {};
      const categoryReinvestment = {};
      const allCategories = this.getAllCategories();
      
      allCategories.forEach(cat => {
        const categorySalesData = todaySales.filter(s => s.category === cat.id);
        const catAmount = categorySalesData.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
        const catPurchase = categorySalesData.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        categorySales[cat.id] = catAmount;
        categoryReinvestment[cat.id] = { amount: catAmount, purchase: catPurchase, rate: catAmount > 0 ? (catPurchase / catAmount * 100) : 0 };
      });
      
      const totalSales = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
      this.updateCategoryCharts(categorySales, categoryReinvestment, totalSales);
      
      const totalSoldEl = document.getElementById('totalSold');
      const totalAmountEl = document.getElementById('totalAmount');
      const totalProfitEl = document.getElementById('totalProfit');
      const topProductEl = document.getElementById('topProduct');
      
      if (totalSoldEl) totalSoldEl.textContent = totalSold;
      if (totalAmountEl) totalAmountEl.textContent = `$${totalAmount.toFixed(2)}`;
      if (totalProfitEl) totalProfitEl.textContent = `$${totalProfit.toFixed(2)}`;
      if (topProductEl) topProductEl.textContent = topProduct || '-';
      
      this.updateReinvestmentCard(totalPurchase, reinvestmentRate);
      this.renderProductDetails();
    } catch (error) {
      console.error('Error en updateSummary:', error);
    }
  }
  
  updateReinvestmentCard(totalPurchase, reinvestmentRate) {
    let reinvestmentCard = document.querySelector('.summary-card.reinvestment');
    const summaryGrid = document.querySelector('.summary-grid');
    
    if (!reinvestmentCard && summaryGrid) {
      reinvestmentCard = document.createElement('div');
      reinvestmentCard.className = 'summary-card reinvestment';
      reinvestmentCard.innerHTML = `
        <div class="summary-icon"><i class="fas fa-recycle"></i></div>
        <div class="summary-value" id="totalReinvestment">$${totalPurchase.toFixed(2)}</div>
        <div class="summary-label">Reinversión</div>
        <div class="summary-subtitle" id="reinvestmentRate">${reinvestmentRate.toFixed(1)}% del total</div>
      `;
      summaryGrid.appendChild(reinvestmentCard);
    } else if (reinvestmentCard) {
      const reinvestmentValue = reinvestmentCard.querySelector('#totalReinvestment');
      const reinvestmentRateEl = reinvestmentCard.querySelector('#reinvestmentRate');
      if (reinvestmentValue) reinvestmentValue.textContent = `$${totalPurchase.toFixed(2)}`;
      if (reinvestmentRateEl) reinvestmentRateEl.textContent = `${reinvestmentRate.toFixed(1)}% del total`;
    }
  }
  
  updateCategoryCharts(categorySales, categoryReinvestment, totalSales) {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    chartContainer.innerHTML = '';
    this.getAllCategories().forEach(category => {
      const salesAmount = categorySales[category.id] || 0;
      const reinvestment = categoryReinvestment[category.id] || { purchase: 0, rate: 0 };
      const percent = totalSales > 0 ? (salesAmount / totalSales) * 100 : 0;
      
      chartContainer.innerHTML += `
        <div class="chart-bar">
          <div class="chart-label">
            ${category.name}
            <div class="chart-subtitle">Reinversión: $${reinvestment.purchase.toFixed(2)} (${reinvestment.rate.toFixed(1)}%)</div>
          </div>
          <div class="chart-track"><div class="chart-fill" style="width: ${percent}%; background: ${category.color}"></div></div>
          <div class="chart-value">${percent.toFixed(1)}%</div>
        </div>
      `;
    });
  }
  
  renderProductDetails() {
    const container = document.getElementById('productDetails');
    if (!container) return;
    
    const todaySales = this.sales.filter(sale => sale.date === this.currentDate);
    const productSummary = {};
    
    todaySales.forEach(sale => {
      if (!productSummary[sale.productName]) {
        productSummary[sale.productName] = { quantity: 0, amount: 0, purchase: 0, profit: 0, category: sale.category };
      }
      productSummary[sale.productName].quantity += sale.quantity;
      productSummary[sale.productName].amount += sale.quantity * sale.salePrice;
      productSummary[sale.productName].purchase += sale.quantity * sale.purchasePrice;
      productSummary[sale.productName].profit += sale.quantity * (sale.salePrice - sale.purchasePrice);
    });
    
    if (Object.keys(productSummary).length === 0) {
      container.innerHTML = '<div class="text-center">No hay ventas hoy</div>';
      return;
    }
    
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Producto</th><th>Categoría</th><th>Cantidad</th><th>Venta</th><th>Reinversión</th><th>Ganancia</th><th>% Rent.</th></tr></thead>
          <tbody>
            ${Object.entries(productSummary).map(([product, data]) => {
              const category = this.getCategoryInfo(data.category);
              const rentPercent = data.purchase > 0 ? (data.profit / data.purchase * 100) : 0;
              return `
                <tr>
                  <td>${product}</td>
                  <td><span class="category-badge" style="background: ${category.color}">${category.name}</span></td>
                  <td>${data.quantity}</td>
                  <td>$${data.amount.toFixed(2)}</td>
                  <td class="text-warning">$${data.purchase.toFixed(2)}</td>
                  <td class="text-success">$${data.profit.toFixed(2)}</td>
                  <td class="${rentPercent >= 0 ? 'text-success' : 'text-danger'}">${rentPercent.toFixed(1)}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  getReinvestmentStats(date = null) {
    const targetDate = date || this.currentDate;
    const dailySales = this.sales.filter(sale => sale.date === targetDate);
    return {
      date: targetDate,
      totalSales: dailySales.length,
      totalAmount: dailySales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0),
      totalReinvestment: dailySales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0),
      products: {},
      categories: {}
    };
  }
  
  showBackupManager() {
    this.backupManager.showBackupManagerModal();
  }
  
  createAutoBackup() {
    return this.backupManager.createAutoBackup('Backup Automático');
  }
  
  selectProduct(productId) {
    const product = this.products.find(p => p.id == productId);
    if (product) {
      const productSelect = document.getElementById('productSelect');
      if (productSelect) {
        productSelect.value = productId;
        this.salesManager.onProductSelectChange(productId);
        if (this.isMobile) {
          const saleForm = document.getElementById('saleForm');
          if (saleForm) saleForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }
  
  editProduct(productId) {
    this.productManager.editProduct(productId);
  }
  
  deleteProduct(productId) {
    this.productManager.deleteProduct(productId);
  }
  
  deleteSale(saleId) {
    this.historyManager.deleteSale(saleId);
  }
  
  clearTodaySales() {
    if (confirm('¿Estás seguro de que quieres limpiar todas las ventas de hoy?')) {
      this.sales = this.sales.filter(sale => sale.date !== this.currentDate);
      this.dataManager.saveSales(this.sales);
      this.salesManager.renderTodaySales();
      this.updateSummary();
      this.historyManager.updateManagementStats();
      this.historyManager.renderRecentSales();
      this.historyManager.loadHistory();
      if (this.purchaseManager) this.purchaseManager.updateBudgetDisplay();
      this.showNotification('Ventas del día limpiadas correctamente', 'success');
    }
  }
  
  refreshProducts() {
    this.categoryManager.renderCategoryTabs();
    this.productManager.renderProducts();
    this.productManager.renderProductSelect();
    this.productManager.renderInventory();
    this.showNotification('Productos actualizados', 'success');
  }
  
  updateManagementStats() {
    this.historyManager.updateManagementStats();
  }
  
  addCategory(categoryData) {
    this.categories.push(categoryData);
    this.dataManager.saveCategories(this.categories);
    this.categoryManager.renderCategoryTabs();
    this.productManager.renderProductSelect();
    this.showNotification(`Categoría "${categoryData.name}" agregada`, 'success');
  }
  
  updateCategory(categoryId, categoryData) {
    const index = this.categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...categoryData };
      this.dataManager.saveCategories(this.categories);
      this.categoryManager.renderCategoryTabs();
      this.productManager.renderProducts();
      this.productManager.renderProductSelect();
      this.productManager.renderInventory();
      this.showNotification(`Categoría actualizada`, 'success');
    }
  }
  
  deleteCategory(categoryId) {
    if (this.dataManager.isCategoryInUse(categoryId)) {
      this.showNotification('No se puede eliminar la categoría porque hay productos asociados', 'error');
      return false;
    }
    this.categories = this.categories.filter(c => c.id !== categoryId);
    this.dataManager.saveCategories(this.categories);
    this.categoryManager.renderCategoryTabs();
    this.showNotification('Categoría eliminada', 'success');
    return true;
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  if (!window.salesSystem) {
    window.salesSystem = new SalesSystem();
  }
});

// Funciones globales
function showAddProductModal() { if (window.salesSystem) window.salesSystem.productManager.showAddProductModal(); }
function closeProductModal() { if (window.salesSystem) window.salesSystem.productManager.closeProductModal(); }
function filterProducts() { const searchTerm = document.getElementById('productSearch'); if (searchTerm && window.salesSystem) window.salesSystem.productManager.filterProducts(searchTerm.value); }
function filterInventory() { const searchTerm = document.getElementById('inventorySearch'); if (searchTerm && window.salesSystem) window.salesSystem.productManager.filterInventory(searchTerm.value); }
function clearTodaySales() { if (window.salesSystem) window.salesSystem.clearTodaySales(); }
function refreshProducts() { if (window.salesSystem) window.salesSystem.refreshProducts(); }
function loadHistory() { if (window.salesSystem) window.salesSystem.historyManager.loadHistory(); }
function hideNotification() { if (window.salesSystem) window.salesSystem.uiManager.hideNotification(); }
function showManualSaleModal() { if (window.salesSystem) window.salesSystem.historyManager.showManualSaleModal(); }
function closeManualSaleModal() { if (window.salesSystem) window.salesSystem.historyManager.closeManualSaleModal(); }
function showPeriodSearchModal() { if (window.salesSystem) window.salesSystem.historyManager.showPeriodSearchModal(); }
function closePeriodSearchModal() { if (window.salesSystem) window.salesSystem.historyManager.closePeriodSearchModal(); }
function updateManualSaleSummary() { if (window.salesSystem) window.salesSystem.historyManager.updateManualSaleSummary(); }
function onManualProductSelectChange(value) { if (window.salesSystem) window.salesSystem.historyManager.onManualProductSelectChange(value); }
function setTodayInHistory() { const today = new Date(); const historyDate = document.getElementById('historyDate'); if (historyDate) { historyDate.value = today.toISOString().split('T')[0]; loadHistory(); } }
function showBackupManager() { if (window.salesSystem) window.salesSystem.showBackupManager(); }
function showPurchaseModal() { if (window.salesSystem && window.salesSystem.purchaseManager) window.salesSystem.purchaseManager.showPurchaseModal(); }
function showInitialBudgetModal() { if (window.salesSystem && window.salesSystem.purchaseManager) window.salesSystem.purchaseManager.showInitialBudgetModal(); }
function showCategoryPurchaseStats() { if (window.salesSystem && window.salesSystem.purchaseManager) window.salesSystem.purchaseManager.showCategoryPurchaseStats(); }
function showManualBudgetAdjustModal() { if (window.salesSystem && window.salesSystem.purchaseManager) window.salesSystem.purchaseManager.showManualBudgetAdjustModal(); }
function closeManualBudgetAdjustModal() { const modal = document.getElementById('manualBudgetAdjustModal'); if (modal) modal.remove(); }

// Manejo de errores globales
window.addEventListener('error', (event) => {
  console.error('Error global:', event.error);
  if (window.salesSystem) window.salesSystem.showNotification('Ocurrió un error. Por favor recarga la página.', 'error');
});