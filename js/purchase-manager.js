// Módulo de Gestión de Compras - CON PRESUPUESTO Y ACUMULADO DE REINVERSIÓN
class PurchaseManager {
    constructor(salesSystem) {
        this.salesSystem = salesSystem;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.manualAdjustments = this.loadManualAdjustments();
    }
    
    loadManualAdjustments() {
        const stored = localStorage.getItem('salesSystem_manualAdjustments');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveManualAdjustments() {
        localStorage.setItem('salesSystem_manualAdjustments', JSON.stringify(this.manualAdjustments));
    }
    
    getManualAdjustmentTotal() {
        return this.manualAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    }
    
    /**
     * Cálculo del efectivo disponible para compras
     * Fórmula: Presupuesto Inicial + Acumulado de Reinversión (todas las ventas) + Ajustes Manuales
     * 
     * La reinversión acumulada es la suma de todos los precios de compra de todas las ventas registradas
     * Esto representa el dinero que se ha reinvertido en el negocio y que está disponible para nuevas compras
     */
    getAvailableBudget() {
        // Acumulado de reinversión: suma de todos los precios de compra de todas las ventas
        const totalReinvestmentAccumulated = this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        const initialBudget = this.salesSystem.budget || 0;
        const manualAdjustment = this.getManualAdjustmentTotal();
        
        // El efectivo disponible = Presupuesto Inicial + Reinversión Acumulada + Ajustes Manuales
        return initialBudget + totalReinvestmentAccumulated + manualAdjustment;
    }
    
    /**
     * Obtiene el detalle de la reinversión acumulada por categoría
     */
    getReinvestmentAccumulatedByCategory() {
        const reinvestmentByCategory = {};
        
        this.salesSystem.sales.forEach(sale => {
            const reinvestmentAmount = sale.quantity * sale.purchasePrice;
            if (!reinvestmentByCategory[sale.category]) {
                reinvestmentByCategory[sale.category] = 0;
            }
            reinvestmentByCategory[sale.category] += reinvestmentAmount;
        });
        
        return reinvestmentByCategory;
    }
    
    /**
     * Obtiene el detalle de la reinversión acumulada por producto
     */
    getReinvestmentAccumulatedByProduct() {
        const reinvestmentByProduct = {};
        
        this.salesSystem.sales.forEach(sale => {
            const reinvestmentAmount = sale.quantity * sale.purchasePrice;
            if (!reinvestmentByProduct[sale.productName]) {
                reinvestmentByProduct[sale.productName] = {
                    productName: sale.productName,
                    category: sale.category,
                    quantity: 0,
                    reinvestment: 0
                };
            }
            reinvestmentByProduct[sale.productName].quantity += sale.quantity;
            reinvestmentByProduct[sale.productName].reinvestment += reinvestmentAmount;
        });
        
        return Object.values(reinvestmentByProduct);
    }
    
    registerPurchase(productId, quantity, purchasePrice, notes = '') {
        const product = this.salesSystem.products.find(p => p.id == productId);
        if (!product) {
            this.salesSystem.showNotification('Producto no encontrado', 'error');
            return false;
        }
        
        const totalCost = quantity * purchasePrice;
        const availableBudget = this.getAvailableBudget();
        
        if (totalCost > availableBudget) {
            this.salesSystem.showNotification(`Presupuesto insuficiente. Disponible: $${availableBudget.toFixed(2)}`, 'error');
            return false;
        }
        
        const purchase = {
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            category: product.category,
            quantity: quantity,
            purchasePrice: purchasePrice,
            totalCost: totalCost,
            notes: notes,
            timestamp: new Date().toISOString(),
            date: this.salesSystem.utils.getLocalDate()
        };
        
        product.stock += quantity;
        product.purchasePrice = purchasePrice;
        
        this.salesSystem.purchases.push(purchase);
        
        this.salesSystem.dataManager.saveProducts(this.salesSystem.products);
        this.salesSystem.dataManager.savePurchases(this.salesSystem.purchases);
        
        this.salesSystem.productManager.renderProducts();
        this.salesSystem.productManager.renderInventory();
        this.salesSystem.productManager.renderProductSelect();
        
        this.renderPurchaseHistory();
        this.updateBudgetDisplay();
        
        this.salesSystem.showNotification(`Compra registrada: ${quantity} ${product.name} por $${totalCost.toFixed(2)}`, 'success');
        return true;
    }
    
    addManualAdjustment(amount, note = '') {
        const adjustment = {
            id: Date.now(),
            amount: amount,
            note: note,
            timestamp: new Date().toISOString(),
            date: this.salesSystem.utils.getLocalDate()
        };
        
        this.manualAdjustments.push(adjustment);
        this.saveManualAdjustments();
        
        this.updateBudgetDisplay();
        this.renderPurchaseHistory();
        
        const adjustmentType = amount >= 0 ? 'aumento' : 'disminución';
        this.salesSystem.showNotification(`Efectivo ajustado: ${adjustmentType} de $${Math.abs(amount).toFixed(2)}`, 'success');
        
        return adjustment;
    }
    
    deleteAdjustment(adjustmentId) {
        if (!confirm('¿Estás seguro de eliminar este ajuste manual?')) return;
        
        const index = this.manualAdjustments.findIndex(adj => adj.id === adjustmentId);
        if (index !== -1) {
            this.manualAdjustments.splice(index, 1);
            this.saveManualAdjustments();
            this.updateBudgetDisplay();
            this.renderPurchaseHistory();
            this.salesSystem.showNotification('Ajuste eliminado correctamente', 'success');
        }
    }
    
    getAdjustmentHistory() {
        return [...this.manualAdjustments].sort((a, b) => b.timestamp - a.timestamp);
    }
    
    updateBudgetDisplay() {
        const budgetElement = document.getElementById('availableBudget');
        if (budgetElement) {
            budgetElement.textContent = `$${this.getAvailableBudget().toFixed(2)}`;
        }
        
        const initialBudgetElement = document.getElementById('initialBudget');
        if (initialBudgetElement) {
            initialBudgetElement.textContent = `$${(this.salesSystem.budget || 0).toFixed(2)}`;
        }
        
        // Actualizar también el display de reinversión acumulada
        const totalReinvestmentAccumulated = this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        const reinvestmentDisplay = document.getElementById('totalReinvestmentAccumulated');
        if (reinvestmentDisplay) {
            reinvestmentDisplay.textContent = `$${totalReinvestmentAccumulated.toFixed(2)}`;
        }
    }
    
    renderPurchaseHistory() {
        const container = document.getElementById('purchaseHistory');
        if (!container) return;
        
        // Limpiar container
        container.innerHTML = '';
        
        // Mostrar resumen de reinversión acumulada
        const totalReinvestmentAccumulated = this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        const reinvestmentByCategory = this.getReinvestmentAccumulatedByCategory();
        
        const summaryHTML = document.createElement('div');
        summaryHTML.className = 'card mb-3';
        summaryHTML.innerHTML = `
            <h5><i class="fas fa-chart-line"></i> Resumen de Reinversión Acumulada</h5>
            <div class="summary-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="summary-card" style="border-top-color: var(--reinvestment-color);">
                    <div class="summary-icon">
                        <i class="fas fa-recycle"></i>
                    </div>
                    <div class="summary-value">$${totalReinvestmentAccumulated.toFixed(2)}</div>
                    <div class="summary-label">Reinversión Acumulada</div>
                    <div class="summary-subtitle">Total de todas las ventas</div>
                </div>
                <div class="summary-card" style="border-top-color: var(--success-color);">
                    <div class="summary-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div class="summary-value">${Object.keys(reinvestmentByCategory).length}</div>
                    <div class="summary-label">Categorías</div>
                    <div class="summary-subtitle">con reinversión</div>
                </div>
            </div>
            <div class="mt-2">
                <h6>Por categoría:</h6>
                <div class="chart-container">
                    ${Object.entries(reinvestmentByCategory).map(([categoryId, amount]) => {
                        const percent = totalReinvestmentAccumulated > 0 ? (amount / totalReinvestmentAccumulated * 100) : 0;
                        const category = this.salesSystem.getCategoryInfo(categoryId);
                        return `
                            <div class="chart-bar">
                                <div class="chart-label">
                                    ${category.name}
                                </div>
                                <div class="chart-track">
                                    <div class="chart-fill" 
                                         style="width: ${percent}%; background: ${category.color}"></div>
                                </div>
                                <div class="chart-value">$${amount.toFixed(2)} (${percent.toFixed(1)}%)</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        container.appendChild(summaryHTML);
        
        // Mostrar compras
        if (!this.salesSystem.purchases || this.salesSystem.purchases.length === 0) {
            const noPurchasesHTML = document.createElement('div');
            noPurchasesHTML.className = 'text-center';
            noPurchasesHTML.innerHTML = '<p>No hay compras registradas</p>';
            container.appendChild(noPurchasesHTML);
        } else {
            const purchasesByDate = {};
            this.salesSystem.purchases.forEach(purchase => {
                if (!purchasesByDate[purchase.date]) {
                    purchasesByDate[purchase.date] = [];
                }
                purchasesByDate[purchase.date].push(purchase);
            });
            
            const sortedDates = Object.keys(purchasesByDate).sort().reverse();
            const isMobile = window.innerWidth < 768;
            
            const purchasesDiv = document.createElement('div');
            purchasesDiv.className = 'mt-3';
            purchasesDiv.innerHTML = '<h5><i class="fas fa-shopping-cart"></i> Historial de Compras</h5>';
            
            if (isMobile) {
                purchasesDiv.innerHTML += `
                    <div class="purchases-list">
                        ${sortedDates.map(date => {
                            const dayPurchases = purchasesByDate[date];
                            const dayTotal = dayPurchases.reduce((sum, p) => sum + p.totalCost, 0);
                            
                            return `
                                <div class="purchase-day-group">
                                    <div class="purchase-day-header">
                                        <i class="fas fa-calendar"></i> ${this.salesSystem.utils.formatDisplayDate(date)}
                                        <span class="purchase-day-total">$${dayTotal.toFixed(2)}</span>
                                    </div>
                                    ${dayPurchases.map(purchase => {
                                        const category = this.salesSystem.getCategoryInfo(purchase.category);
                                        return `
                                            <div class="purchase-item">
                                                <div class="purchase-item-header">
                                                    <span class="purchase-product">${purchase.productName}</span>
                                                    <span class="purchase-quantity">${purchase.quantity} x $${purchase.purchasePrice.toFixed(2)}</span>
                                                </div>
                                                <div class="purchase-item-details">
                                                    <span class="category-badge" style="background: ${category.color}">${category.name}</span>
                                                    <span class="purchase-total">Total: $${purchase.totalCost.toFixed(2)}</span>
                                                </div>
                                                ${purchase.notes ? `<div class="purchase-notes"><i class="fas fa-sticky-note"></i> ${purchase.notes}</div>` : ''}
                                                <button class="btn btn-small btn-danger" onclick="window.salesSystem.purchaseManager.deletePurchase(${purchase.id})">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                purchasesDiv.innerHTML += `
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Total</th>
                                    <th>Notas</th>
                                    <th>Acciones</th>
                                 </thead>
                                <tbody>
                                    ${this.salesSystem.purchases.slice().reverse().map(purchase => {
                                        const category = this.salesSystem.getCategoryInfo(purchase.category);
                                        return `
                                            <tr>
                                                <td>${this.salesSystem.utils.formatDisplayDate(purchase.date)}</td>
                                                <td>${purchase.productName}</td>
                                                <td><span class="category-badge" style="background: ${category.color}">${category.name}</span></td>
                                                <td>${purchase.quantity}</td>
                                                <td>$${purchase.purchasePrice.toFixed(2)}</td>
                                                <td class="text-warning">$${purchase.totalCost.toFixed(2)}</td>
                                                <td>${purchase.notes || '-'}</td>
                                                <td>
                                                    <button class="btn btn-small btn-danger" onclick="window.salesSystem.purchaseManager.deletePurchase(${purchase.id})">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                 </td>
                                             </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                             </table>
                        </div>
                    </div>
                `;
            }
            container.appendChild(purchasesDiv);
        }
        
        // Mostrar ajustes manuales si existen
        const adjustments = this.getAdjustmentHistory();
        if (adjustments.length > 0) {
            const adjustmentsHTML = document.createElement('div');
            adjustmentsHTML.className = 'card mt-2';
            adjustmentsHTML.innerHTML = `
                <h5><i class="fas fa-pencil-alt"></i> Historial de Ajustes Manuales</h5>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Motivo</th>
                                <th>Acciones</th>
                            </thead>
                            <tbody>
                                ${adjustments.map(adj => {
                                    const adjAmount = adj.amount;
                                    const amountClass = adjAmount >= 0 ? 'text-success' : 'text-danger';
                                    const amountSign = adjAmount >= 0 ? '+' : '';
                                    return `
                                        <tr>
                                            <td>${this.salesSystem.utils.formatDisplayDate(adj.date)}</td>
                                            <td class="${amountClass}">${amountSign}$${adjAmount.toFixed(2)}</td>
                                            <td>${adj.note || '-'}</td>
                                            <td>
                                                <button class="btn btn-small btn-danger" onclick="window.salesSystem.purchaseManager.deleteAdjustment(${adj.id})">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                             </td>
                                         </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            container.appendChild(adjustmentsHTML);
        }
    }
    
    deletePurchase(purchaseId) {
        if (!confirm('¿Estás seguro de eliminar esta compra?')) return;
        
        const purchaseIndex = this.salesSystem.purchases.findIndex(p => p.id === purchaseId);
        if (purchaseIndex === -1) return;
        
        const purchase = this.salesSystem.purchases[purchaseIndex];
        const product = this.salesSystem.products.find(p => p.id === purchase.productId);
        
        if (product) {
            product.stock -= purchase.quantity;
            this.salesSystem.dataManager.saveProducts(this.salesSystem.products);
            this.salesSystem.productManager.renderProducts();
            this.salesSystem.productManager.renderInventory();
            this.salesSystem.productManager.renderProductSelect();
        }
        
        this.salesSystem.purchases.splice(purchaseIndex, 1);
        this.salesSystem.dataManager.savePurchases(this.salesSystem.purchases);
        
        this.renderPurchaseHistory();
        this.updateBudgetDisplay();
        
        this.salesSystem.showNotification('Compra eliminada correctamente', 'success');
    }
    
    getCategoryPurchaseStats() {
        const stats = {};
        
        this.salesSystem.categories.forEach(cat => {
            stats[cat.id] = {
                categoryId: cat.id,
                categoryName: cat.name,
                totalPurchases: 0,
                totalQuantity: 0,
                totalCost: 0,
                products: {}
            };
        });
        
        this.salesSystem.purchases.forEach(purchase => {
            if (stats[purchase.category]) {
                stats[purchase.category].totalPurchases++;
                stats[purchase.category].totalQuantity += purchase.quantity;
                stats[purchase.category].totalCost += purchase.totalCost;
                
                if (!stats[purchase.category].products[purchase.productName]) {
                    stats[purchase.category].products[purchase.productName] = {
                        productName: purchase.productName,
                        quantity: 0,
                        cost: 0,
                        purchases: 0
                    };
                }
                stats[purchase.category].products[purchase.productName].quantity += purchase.quantity;
                stats[purchase.category].products[purchase.productName].cost += purchase.totalCost;
                stats[purchase.category].products[purchase.productName].purchases++;
            }
        });
        
        return stats;
    }
    
    showPurchaseModal() {
        const modalHTML = `
            <div id="purchaseModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-shopping-cart"></i>
                            Registrar Compra
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="purchaseForm">
                            <div class="form-group">
                                <label for="purchaseProductSelect">Producto *</label>
                                <select id="purchaseProductSelect" required class="form-control">
                                    <option value="">Selecciona un producto</option>
                                    ${this.salesSystem.products.map(p => `
                                        <option value="${p.id}">${p.name} (Stock: ${p.stock})</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="purchaseQuantity">Cantidad *</label>
                                    <input type="number" id="purchaseQuantity" min="1" value="1" required class="form-control">
                                </div>
                                
                                <div class="form-group">
                                    <label for="purchasePrice">Precio Unitario *</label>
                                    <input type="number" id="purchasePrice" step="0.01" min="0" required class="form-control">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="purchaseNotes">Notas (opcional)</label>
                                <textarea id="purchaseNotes" class="form-control" rows="2" placeholder="Ej: Proveedor, factura, etc."></textarea>
                            </div>
                            
                            <div class="sale-summary">
                                <div class="summary-item">
                                    <span>Total Compra:</span>
                                    <span id="purchaseTotal">$0.00</span>
                                </div>
                                <div class="summary-item">
                                    <span>Reinversión Acumulada:</span>
                                    <span id="totalReinvestmentDisplay" class="text-info">$${this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0).toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Presupuesto Inicial:</span>
                                    <span id="initialBudgetDisplay">$${(this.salesSystem.budget || 0).toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Ajustes Manuales:</span>
                                    <span id="manualAdjustmentDisplay" class="text-warning">$${this.getManualAdjustmentTotal().toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Efectivo Disponible:</span>
                                    <span id="purchaseAvailableBudget" class="text-success">$${this.getAvailableBudget().toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Registrar Compra
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('purchaseModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const productSelect = document.getElementById('purchaseProductSelect');
        const quantityInput = document.getElementById('purchaseQuantity');
        const priceInput = document.getElementById('purchasePrice');
        
        if (productSelect) {
            productSelect.addEventListener('change', (e) => {
                const product = this.salesSystem.products.find(p => p.id == e.target.value);
                if (product && priceInput) {
                    priceInput.value = product.purchasePrice;
                    this.updatePurchaseTotal();
                }
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.updatePurchaseTotal());
        }
        
        if (priceInput) {
            priceInput.addEventListener('input', () => this.updatePurchaseTotal());
        }
        
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            purchaseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitPurchase();
            });
        }
        
        const modal = document.getElementById('purchaseModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    updatePurchaseTotal() {
        const quantity = parseInt(document.getElementById('purchaseQuantity')?.value) || 0;
        const price = parseFloat(document.getElementById('purchasePrice')?.value) || 0;
        const total = quantity * price;
        
        const totalElement = document.getElementById('purchaseTotal');
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
        
        const availableBudget = this.getAvailableBudget();
        const budgetElement = document.getElementById('purchaseAvailableBudget');
        if (budgetElement) {
            budgetElement.textContent = `$${availableBudget.toFixed(2)}`;
            
            if (total > availableBudget) {
                budgetElement.classList.add('text-danger');
                budgetElement.classList.remove('text-success');
            } else {
                budgetElement.classList.add('text-success');
                budgetElement.classList.remove('text-danger');
            }
        }
    }
    
    submitPurchase() {
        const productId = document.getElementById('purchaseProductSelect')?.value;
        const quantity = parseInt(document.getElementById('purchaseQuantity')?.value);
        const purchasePrice = parseFloat(document.getElementById('purchasePrice')?.value);
        const notes = document.getElementById('purchaseNotes')?.value || '';
        
        if (!productId || !quantity || !purchasePrice) {
            this.salesSystem.showNotification('Por favor completa todos los campos obligatorios', 'error');
            return;
        }
        
        this.registerPurchase(productId, quantity, purchasePrice, notes);
        
        const modal = document.getElementById('purchaseModal');
        if (modal) modal.remove();
    }
    
    showInitialBudgetModal() {
        const modalHTML = `
            <div id="budgetModal" class="modal">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-coins"></i>
                            Configurar Presupuesto Inicial
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="budgetForm">
                            <div class="form-group">
                                <label for="initialBudgetAmount">Monto Inicial</label>
                                <input type="number" id="initialBudgetAmount" step="0.01" min="0" 
                                       value="${this.salesSystem.budget || 0}" required class="form-control">
                                <small class="form-text text-muted">Capital inicial disponible para el negocio</small>
                            </div>
                            
                            <div class="sale-summary mt-2">
                                <div class="summary-item">
                                    <span>Reinversión Acumulada:</span>
                                    <span id="totalReinvestmentPreview" class="text-info">$${this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0).toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Ajustes Manuales:</span>
                                    <span id="manualAdjustmentPreview" class="text-warning">$${this.getManualAdjustmentTotal().toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Efectivo Total:</span>
                                    <span id="totalBudgetPreview" class="text-success">$${(this.salesSystem.budget || 0) + this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0) + this.getManualAdjustmentTotal()}</span>
                                </div>
                            </div>
                            
                            <div class="form-actions mt-3">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('budgetModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const budgetInput = document.getElementById('initialBudgetAmount');
        if (budgetInput) {
            budgetInput.addEventListener('input', () => {
                const newBudget = parseFloat(budgetInput.value) || 0;
                const totalReinvestment = this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
                const manualAdjustment = this.getManualAdjustmentTotal();
                const totalElement = document.getElementById('totalBudgetPreview');
                if (totalElement) {
                    totalElement.textContent = `$${(newBudget + totalReinvestment + manualAdjustment).toFixed(2)}`;
                }
            });
        }
        
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = parseFloat(document.getElementById('initialBudgetAmount')?.value);
                if (!isNaN(amount) && amount >= 0) {
                    this.salesSystem.budget = amount;
                    this.salesSystem.dataManager.saveBudget(amount);
                    this.updateBudgetDisplay();
                    this.renderPurchaseHistory();
                    this.salesSystem.showNotification(`Presupuesto inicial configurado: $${amount.toFixed(2)}`, 'success');
                    const modal = document.getElementById('budgetModal');
                    if (modal) modal.remove();
                }
            });
        }
        
        const modal = document.getElementById('budgetModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    showManualBudgetAdjustModal() {
        const availableBudget = this.getAvailableBudget();
        const totalReinvestmentAccumulated = this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        const manualAdjustment = this.getManualAdjustmentTotal();
        
        const modalHTML = `
            <div id="manualBudgetAdjustModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-pencil-alt"></i>
                            Ajustar Efectivo Disponible
                        </h3>
                        <button class="modal-close" onclick="closeManualBudgetAdjustModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="manualBudgetAdjustForm">
                            <div class="form-group">
                                <label for="currentAvailableBudget">Efectivo Actual</label>
                                <input type="text" id="currentAvailableBudget" readonly 
                                       value="$${availableBudget.toFixed(2)}" class="form-control readonly-input">
                            </div>
                            
                            <div class="form-group">
                                <label for="newAvailableBudget">Nuevo Efectivo *</label>
                                <input type="number" id="newAvailableBudget" step="0.01" 
                                       value="${availableBudget}" required class="form-control">
                                <small class="form-text text-muted">Ingresa el nuevo monto total de efectivo disponible</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="adjustmentNote">Motivo del ajuste</label>
                                <textarea id="adjustmentNote" rows="2" class="form-control" 
                                          placeholder="Ej: Depósito adicional, retiro de efectivo, etc."></textarea>
                            </div>
                            
                            <div class="sale-summary">
                                <div class="summary-item">
                                    <span>Presupuesto Inicial:</span>
                                    <span id="initialBudgetDisplay">$${(this.salesSystem.budget || 0).toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Reinversión Acumulada:</span>
                                    <span id="totalReinvestmentDisplay" class="text-info">$${totalReinvestmentAccumulated.toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Ajustes Manuales Actuales:</span>
                                    <span id="manualAdjustmentDisplay" class="text-warning">$${manualAdjustment.toFixed(2)}</span>
                                </div>
                                <div class="summary-item" id="newAdjustmentRow" style="display: none;">
                                    <span>Nuevo Ajuste:</span>
                                    <span id="newAdjustmentAmount" class="text-info">$0.00</span>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="closeManualBudgetAdjustModal()">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Aplicar Ajuste
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('manualBudgetAdjustModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const newBudgetInput = document.getElementById('newAvailableBudget');
        const newAdjustmentRow = document.getElementById('newAdjustmentRow');
        const newAdjustmentAmount = document.getElementById('newAdjustmentAmount');
        
        if (newBudgetInput && newAdjustmentRow && newAdjustmentAmount) {
            newBudgetInput.addEventListener('input', () => {
                const newBudget = parseFloat(newBudgetInput.value) || 0;
                const adjustmentAmount = newBudget - availableBudget;
                
                if (adjustmentAmount !== 0) {
                    newAdjustmentRow.style.display = 'flex';
                    newAdjustmentAmount.textContent = `${adjustmentAmount >= 0 ? '+' : ''}$${adjustmentAmount.toFixed(2)}`;
                    newAdjustmentAmount.className = adjustmentAmount >= 0 ? 'text-success' : 'text-danger';
                } else {
                    newAdjustmentRow.style.display = 'none';
                }
            });
        }
        
        const adjustForm = document.getElementById('manualBudgetAdjustForm');
        if (adjustForm) {
            adjustForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newBudget = parseFloat(document.getElementById('newAvailableBudget')?.value);
                const adjustmentAmount = newBudget - availableBudget;
                const note = document.getElementById('adjustmentNote')?.value || 'Ajuste manual de efectivo';
                
                if (!isNaN(adjustmentAmount) && adjustmentAmount !== 0) {
                    this.addManualAdjustment(adjustmentAmount, note);
                    closeManualBudgetAdjustModal();
                } else if (adjustmentAmount === 0) {
                    this.salesSystem.showNotification('No se realizó ningún cambio en el efectivo', 'info');
                    closeManualBudgetAdjustModal();
                }
            });
        }
        
        const modal = document.getElementById('manualBudgetAdjustModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    showCategoryPurchaseStats() {
        const stats = this.getCategoryPurchaseStats();
        const totalSpent = this.salesSystem.purchases.reduce((sum, p) => sum + p.totalCost, 0);
        const totalReinvestmentAccumulated = this.salesSystem.sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        
        const modalHTML = `
            <div id="purchaseStatsModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-chart-pie"></i>
                            Reporte de Compras por Categoría
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="summary-mini mb-3">
                            <span><i class="fas fa-recycle"></i> Reinversión Acumulada: $${totalReinvestmentAccumulated.toFixed(2)}</span>
                            <span><i class="fas fa-shopping-cart"></i> Total Compras: $${totalSpent.toFixed(2)}</span>
                            <span><i class="fas fa-chart-line"></i> Saldo Disponible: $${(totalReinvestmentAccumulated - totalSpent).toFixed(2)}</span>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Categoría</th>
                                        <th>N° Compras</th>
                                        <th>Cantidad Total</th>
                                        <th>Inversión Total</th>
                                        <th>% del Total</th>
                                    </thead>
                                <tbody>
                                    ${Object.values(stats).map(stat => {
                                        const percent = totalSpent > 0 ? (stat.totalCost / totalSpent * 100) : 0;
                                        const category = this.salesSystem.getCategoryInfo(stat.categoryId);
                                        return `
                                            <tr>
                                                <td>
                                                    <span class="category-badge" style="background: ${category.color}">
                                                        ${stat.categoryName}
                                                    </span>
                                                 </tr>
                                                 <td>${stat.totalPurchases}</td>
                                                 <td>${stat.totalQuantity}</td>
                                                <td class="text-warning">$${stat.totalCost.toFixed(2)}</td>
                                                <td>${percent.toFixed(1)}%</td>
                                             </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                                <tfoot>
                                    <tr class="table-info">
                                        <th>Total</th>
                                        <th>${this.salesSystem.purchases.length}</th>
                                        <th>${this.salesSystem.purchases.reduce((sum, p) => sum + p.quantity, 0)}</th>
                                        <th>$${totalSpent.toFixed(2)}</th>
                                        <th>100%</th>
                                     </tr>
                                </tfoot>
                             </table>
                        </div>
                        
                        <h5 class="mt-3">Detalle por Producto</h5>
                        ${Object.values(stats).map(stat => {
                            if (Object.keys(stat.products).length === 0) return '';
                            const category = this.salesSystem.getCategoryInfo(stat.categoryId);
                            return `
                                <div class="card mt-2">
                                    <h6 style="margin-bottom: 0.5rem;">
                                        <span class="category-badge" style="background: ${category.color}">${stat.categoryName}</span>
                                    </h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Compras</th>
                                                    <th>Cantidad</th>
                                                    <th>Total</th>
                                                 </thead>
                                            <tbody>
                                                ${Object.values(stat.products).map(product => `
                                                     <tr>
                                                         <td>${product.productName}</td>
                                                         <td>${product.purchases}</td>
                                                         <td>${product.quantity}</td>
                                                        <td class="text-warning">$${product.cost.toFixed(2)}</td>
                                                     </tr>
                                                `).join('')}
                                            </tbody>
                                         </table>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('purchaseStatsModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('purchaseStatsModal');
        if (modal) modal.classList.remove('hidden');
    }
}
