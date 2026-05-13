// Módulo de Gestión de Historial y Búsquedas - CON BÚSQUEDA POR PRODUCTO
class HistoryManager {
    constructor(app) {
        this.app = app;
    }
    
    loadHistory() {
        const dateInput = document.getElementById('historyDate');
        let selectedDate;
        
        if (dateInput.value) {
            selectedDate = this.app.utils.parseInputDateToLocal(dateInput.value);
        } else {
            selectedDate = this.app.currentDate;
            const today = new Date();
            const todayFormatted = today.toISOString().split('T')[0];
            dateInput.value = todayFormatted;
        }
        
        const container = document.getElementById('salesHistory');
        const daySales = this.app.sales.filter(sale => sale.date === selectedDate);
        const displayDate = this.app.utils.formatDisplayDate(selectedDate);
        
        if (daySales.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <p>No hay ventas registradas para el ${displayDate}</p>
                </div>
            `;
            return;
        }
        
        const totalAmount = daySales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
        const totalReinvestment = daySales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        const totalProfit = totalAmount - totalReinvestment;
        const totalItems = daySales.reduce((sum, sale) => sum + sale.quantity, 0);
        const reinvestmentRate = totalAmount > 0 ? (totalReinvestment / totalAmount * 100) : 0;
        
        container.innerHTML = `
            <div class="card">
                <h4>Resumen del ${displayDate}</h4>
                <div class="summary-mini">
                    <span><i class="fas fa-shopping-cart"></i> ${daySales.length} Ventas</span>
                    <span><i class="fas fa-cube"></i> ${totalItems} Artículos</span>
                    <span><i class="fas fa-money-bill"></i> $${totalAmount.toFixed(2)} Total</span>
                    <span><i class="fas fa-recycle"></i> $${totalReinvestment.toFixed(2)} Reinversión</span>
                    <span><i class="fas fa-chart-line"></i> $${totalProfit.toFixed(2)} Ganancia</span>
                    <span><i class="fas fa-percentage"></i> ${reinvestmentRate.toFixed(1)}% Reinversión</span>
                </div>
            </div>
            
            <div class="card mt-2">
                <h4>Detalle de Ventas</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                            <th>Reinversión</th>
                            <th>Ganancia</th>
                            <th>Hora</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${daySales.map(sale => {
                            const saleDate = new Date(sale.timestamp);
                            const saleTime = saleDate.toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                            const category = this.app.getCategoryInfo(sale.category);
                            const total = sale.quantity * sale.salePrice;
                            const reinvestment = sale.quantity * sale.purchasePrice;
                            const profit = total - reinvestment;
                            
                            return `
                            <tr>
                                <td>${sale.productName}</td>
                                <td>
                                    <span class="category-badge" style="background: ${category.color}">
                                        ${category.name}
                                    </span>
                                </td>
                                <td>${sale.quantity}</td>
                                <td>$${sale.salePrice.toFixed(2)}</td>
                                <td>$${total.toFixed(2)}</td>
                                <td class="text-warning">$${reinvestment.toFixed(2)}</td>
                                <td class="text-success">$${profit.toFixed(2)}</td>
                                <td>${saleTime}</td>
                                <td>
                                    <button class="btn btn-small btn-danger" onclick="salesSystem.deleteSale(${sale.id})">
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
    }
    
    searchByPeriod() {
        const startDate = document.getElementById('periodStartDate').value;
        const endDate = document.getElementById('periodEndDate').value;
        const productFilter = document.getElementById('periodProductFilter')?.value || '';
        
        if (!startDate || !endDate) {
            this.app.showNotification('Por favor selecciona ambas fechas', 'error');
            return;
        }
        
        const parsedStartDate = this.app.utils.parseInputDateToLocal(startDate);
        const parsedEndDate = this.app.utils.parseInputDateToLocal(endDate);
        
        if (!parsedStartDate || !parsedEndDate) {
            this.app.showNotification('Fechas inválidas', 'error');
            return;
        }
        
        const start = new Date(parsedStartDate);
        const end = new Date(parsedEndDate);
        
        if (start > end) {
            this.app.showNotification('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
            return;
        }
        
        let periodSales = this.app.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= start && saleDate <= end;
        });
        
        if (productFilter && productFilter !== 'all') {
            periodSales = periodSales.filter(sale => sale.productId == productFilter);
        }
        
        this.renderPeriodResults(periodSales, parsedStartDate, parsedEndDate, productFilter);
    }
    
    renderPeriodResults(sales, startDate, endDate, productFilter = '') {
        const container = document.getElementById('periodSearchResults');
        
        let filteredProduct = null;
        if (productFilter && productFilter !== 'all') {
            filteredProduct = this.app.products.find(p => p.id == productFilter);
        }
        
        if (sales.length === 0) {
            const filterMessage = filteredProduct ? ` para "${filteredProduct.name}"` : '';
            container.innerHTML = `
                <div class="text-center">
                    <p>No hay ventas registradas en el período seleccionado${filterMessage}</p>
                </div>
            `;
            return;
        }
        
        const totalSalesCount = sales.length;
        const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalAmount = sales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
        const totalReinvestment = sales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
        const totalProfit = totalAmount - totalReinvestment;
        const reinvestmentRate = totalAmount > 0 ? (totalReinvestment / totalAmount * 100) : 0;
        
        const productStats = {};
        sales.forEach(sale => {
            if (!productStats[sale.productName]) {
                productStats[sale.productName] = {
                    productId: sale.productId,
                    productName: sale.productName,
                    quantity: 0,
                    amount: 0,
                    reinvestment: 0,
                    profit: 0,
                    category: sale.category,
                    salesCount: 0
                };
            }
            productStats[sale.productName].quantity += sale.quantity;
            productStats[sale.productName].amount += sale.quantity * sale.salePrice;
            productStats[sale.productName].reinvestment += sale.quantity * sale.purchasePrice;
            productStats[sale.productName].profit += sale.quantity * (sale.salePrice - sale.purchasePrice);
            productStats[sale.productName].salesCount++;
        });
        
        const categoryStats = {};
        const allCategories = this.app.getAllCategories();
        allCategories.forEach(cat => {
            categoryStats[cat.id] = { sales: 0, amount: 0, reinvestment: 0, profit: 0 };
        });
        
        sales.forEach(sale => {
            if (categoryStats[sale.category]) {
                categoryStats[sale.category].sales += sale.quantity;
                categoryStats[sale.category].amount += sale.quantity * sale.salePrice;
                categoryStats[sale.category].reinvestment += sale.quantity * sale.purchasePrice;
                categoryStats[sale.category].profit += sale.quantity * (sale.salePrice - sale.purchasePrice);
            }
        });
        
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        
        const salesByDate = {};
        sales.forEach(sale => {
            if (!salesByDate[sale.date]) {
                salesByDate[sale.date] = [];
            }
            salesByDate[sale.date].push(sale);
        });
        
        const filterTitle = filteredProduct ? ` - Producto: ${filteredProduct.name}` : '';
        
        container.innerHTML = `
            <div class="card">
                <h4>Reporte del ${this.app.utils.formatDisplayDate(startDate)} al ${this.app.utils.formatDisplayDate(endDate)}${filterTitle}</h4>
                
                <div class="summary-grid mt-2">
                    <div class="summary-card sales">
                        <div class="summary-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="summary-value">${totalSalesCount}</div>
                        <div class="summary-label">Ventas Totales</div>
                        <div class="summary-subtitle">transacciones</div>
                    </div>
                    
                    <div class="summary-card revenue">
                        <div class="summary-icon">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="summary-value">$${totalAmount.toFixed(2)}</div>
                        <div class="summary-label">Monto Total</div>
                        <div class="summary-subtitle">en ventas</div>
                    </div>
                    
                    <div class="summary-card profit">
                        <div class="summary-icon">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div class="summary-value">$${totalProfit.toFixed(2)}</div>
                        <div class="summary-label">Ganancia Total</div>
                        <div class="summary-subtitle">bruta</div>
                    </div>
                    
                    <div class="summary-card reinvestment">
                        <div class="summary-icon">
                            <i class="fas fa-recycle"></i>
                        </div>
                        <div class="summary-value">$${totalReinvestment.toFixed(2)}</div>
                        <div class="summary-label">Reinversión</div>
                        <div class="summary-subtitle">${reinvestmentRate.toFixed(1)}% del total</div>
                    </div>
                </div>
            </div>
            
            <div class="card mt-2">
                <h5><i class="fas fa-trophy"></i> Top 5 Productos más vendidos</h5>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Cantidad</th>
                                <th>Ventas</th>
                                <th>Monto</th>
                                <th>Ganancia</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topProducts.map(product => {
                                const category = this.app.getCategoryInfo(product.category);
                                return `
                                    <tr>
                                        <td>${product.productName}</td>
                                        <td>
                                            <span class="category-badge" style="background: ${category.color}">
                                                ${category.name}
                                            </span>
                                        </td>
                                        <td>${product.quantity}</td>
                                        <td>${product.salesCount}</td>
                                        <td>$${product.amount.toFixed(2)}</td>
                                        <td>$${product.profit.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <h5 class="mt-3 mb-2">
                <i class="fas fa-tags"></i> Análisis por Categoría
            </h5>
            <div class="card mb-3">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Artículos</th>
                                <th>Monto</th>
                                <th>Reinversión</th>
                                <th>Ganancia</th>
                                <th>% Rein.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allCategories.map(category => {
                                const stats = categoryStats[category.id] || { sales: 0, amount: 0, reinvestment: 0, profit: 0 };
                                const reinPercent = stats.amount > 0 ? (stats.reinvestment / stats.amount * 100) : 0;
                                
                                if (stats.sales === 0) return '';
                                
                                return `
                                    <tr>
                                        <td>
                                            <span class="category-badge" style="background: ${category.color}">
                                                ${category.name}
                                            </span>
                                        </td>
                                        <td>${stats.sales}</td>
                                        <td>$${stats.amount.toFixed(2)}</td>
                                        <td class="text-warning">$${stats.reinvestment.toFixed(2)}</td>
                                        <td class="text-success">$${stats.profit.toFixed(2)}</td>
                                        <td class="${reinPercent <= 50 ? 'text-success' : 'text-warning'}">
                                            ${reinPercent.toFixed(1)}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <h5 class="mt-3 mb-2">
                <i class="fas fa-calendar-day"></i> Detalle por Día
            </h5>
            
            ${Object.entries(salesByDate).map(([date, daySales]) => {
                const dayTotal = daySales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
                const dayReinvestment = daySales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0);
                const dayProfit = dayTotal - dayReinvestment;
                const dayItems = daySales.reduce((sum, sale) => sum + sale.quantity, 0);
                
                return `
                    <div class="period-day-card mt-2">
                        <div class="period-day-header">
                            <div class="period-day-date">
                                <i class="fas fa-calendar"></i> ${this.app.utils.formatDisplayDate(date)}
                            </div>
                            <div class="period-day-summary">
                                <span class="period-day-item">
                                    <i class="fas fa-shopping-cart"></i> ${daySales.length} ventas
                                </span>
                                <span class="period-day-item">
                                    <i class="fas fa-cube"></i> ${dayItems} artículos
                                </span>
                                <span class="period-day-item">
                                    <i class="fas fa-money-bill"></i> $${dayTotal.toFixed(2)}
                                </span>
                                <span class="period-day-item text-success">
                                    <i class="fas fa-chart-line"></i> $${dayProfit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Cant.</th>
                                    <th>Precio</th>
                                    <th>Total</th>
                                    <th>Reinversión</th>
                                    <th>Ganancia</th>
                                    <th>Hora</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${daySales.map(sale => {
                                    const saleTotal = sale.quantity * sale.salePrice;
                                    const saleReinvestment = sale.quantity * sale.purchasePrice;
                                    const saleProfit = saleTotal - saleReinvestment;
                                    const saleDate = new Date(sale.timestamp);
                                    const saleTime = saleDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                    const category = this.app.getCategoryInfo(sale.category);
                                    
                                    return `
                                        <tr>
                                            <td>${sale.productName}</td>
                                            <td>
                                                <span class="category-badge" style="background: ${category.color}">
                                                    ${category.name}
                                                </span>
                                            </td>
                                            <td>${sale.quantity}</td>
                                            <td>$${sale.salePrice.toFixed(2)}</td>
                                            <td>$${saleTotal.toFixed(2)}</td>
                                            <td class="text-warning">$${saleReinvestment.toFixed(2)}</td>
                                            <td class="text-success">$${saleProfit.toFixed(2)}</td>
                                            <td>${saleTime}</td>
                                            <td>
                                                <button class="btn btn-small btn-danger" onclick="salesSystem.deleteSale(${sale.id})">
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
            }).join('')}
        `;
    }
    
    deleteSale(saleId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
            const saleIndex = this.app.sales.findIndex(s => s.id === saleId);
            if (saleIndex !== -1) {
                const sale = this.app.sales[saleIndex];
                
                if (sale.date === this.app.currentDate) {
                    const product = this.app.products.find(p => p.id === sale.productId);
                    if (product) {
                        product.stock += sale.quantity;
                        this.app.dataManager.saveProducts(this.app.products);
                        this.app.productManager.renderProducts();
                        this.app.productManager.renderProductSelect();
                    }
                }
                
                this.app.sales.splice(saleIndex, 1);
                this.app.dataManager.saveSales(this.app.sales);
                
                this.app.salesManager.renderTodaySales();
                this.app.updateSummary();
                this.loadHistory();
                this.updateManagementStats();
                this.renderRecentSales();
                
                this.app.showNotification('Venta eliminada correctamente', 'success');
            }
        }
    }
    
    updateManagementStats() {
        document.getElementById('totalSalesStat').textContent = this.app.sales.length;
        document.getElementById('totalProductsStat').textContent = this.app.products.length;
        const uniqueDates = new Set(this.app.sales.map(sale => sale.date));
        document.getElementById('totalDaysStat').textContent = uniqueDates.size;
    }
    
    renderRecentSales() {
        const container = document.getElementById('recentSales');
        const recentSales = [...this.app.sales]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
        
        if (recentSales.length === 0) {
            container.innerHTML = '<div class="text-center">No hay ventas registradas</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="recent-sales">
                ${recentSales.map(sale => {
                    const total = sale.quantity * sale.salePrice;
                    const reinvestment = sale.quantity * sale.purchasePrice;
                    const profit = total - reinvestment;
                    const date = new Date(sale.timestamp);
                    const formattedDate = date.toLocaleDateString('es-ES');
                    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const category = this.app.getCategoryInfo(sale.category);
                    
                    return `
                        <div class="recent-sale-item">
                            <div class="recent-sale-info">
                                <div class="recent-sale-product">
                                    <span class="category-badge" style="background: ${category.color}; margin-right: 0.5rem; padding: 0.1rem 0.5rem;">
                                        ${category.name}
                                    </span>
                                    ${sale.productName}
                                </div>
                                <div class="recent-sale-details">
                                    <span>${formattedDate}</span>
                                    <span>${formattedTime}</span>
                                    <span>${sale.quantity} x $${sale.salePrice.toFixed(2)}</span>
                                    <span class="text-warning">$${reinvestment.toFixed(2)}</span>
                                    <span class="text-success">$${profit.toFixed(2)}</span>
                                </div>
                            </div>
                            <button class="btn btn-small btn-danger" onclick="salesSystem.deleteSale(${sale.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    showManualSaleModal() {
        document.getElementById('manualSaleModal').classList.remove('hidden');
        const today = new Date();
        document.getElementById('manualSaleDate').value = today.toISOString().split('T')[0];
        this.app.productManager.renderProductSelect();
    }
    
    closeManualSaleModal() {
        document.getElementById('manualSaleModal').classList.add('hidden');
        document.getElementById('manualSaleForm').reset();
        document.getElementById('manualPurchasePrice').value = '';
        document.getElementById('manualSaleTotal').textContent = '$0.00';
        document.getElementById('manualSaleProfit').textContent = '$0.00';
    }
    
    onManualProductSelectChange(productId) {
        const product = this.app.products.find(p => p.id == productId);
        if (product) {
            document.getElementById('manualPurchasePrice').value = product.purchasePrice;
            document.getElementById('manualSalePrice').value = product.salePrice;
            this.updateManualSaleSummary();
        } else {
            document.getElementById('manualPurchasePrice').value = '';
            document.getElementById('manualSalePrice').value = '';
        }
    }
    
    updateManualSaleSummary() {
        const quantity = parseInt(document.getElementById('manualQuantity').value) || 0;
        const salePrice = parseFloat(document.getElementById('manualSalePrice').value) || 0;
        const purchasePrice = parseFloat(document.getElementById('manualPurchasePrice').value) || 0;

        const totalSale = quantity * salePrice;
        const reinvestment = quantity * purchasePrice;
        const totalProfit = totalSale - reinvestment;

        document.getElementById('manualSaleTotal').textContent = `$${totalSale.toFixed(2)}`;
        document.getElementById('manualSaleProfit').textContent = `$${totalProfit.toFixed(2)}`;
    }
    
    registerManualSale() {
        const productId = document.getElementById('manualProductSelect').value;
        const quantity = parseInt(document.getElementById('manualQuantity').value);
        const salePrice = parseFloat(document.getElementById('manualSalePrice').value);
        const saleDate = document.getElementById('manualSaleDate').value;

        if (!productId || !quantity || !salePrice || !saleDate) {
            this.app.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        const parsedDate = this.app.utils.parseInputDateToLocal(saleDate);
        
        if (!parsedDate) {
            this.app.showNotification('Fecha inválida', 'error');
            return;
        }

        const product = this.app.products.find(p => p.id == productId);
        if (!product) {
            this.app.showNotification('Producto no encontrado', 'error');
            return;
        }

        const sale = {
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            category: product.category,
            quantity: quantity,
            salePrice: salePrice,
            purchasePrice: product.purchasePrice,
            timestamp: new Date(saleDate + 'T12:00:00').toISOString(),
            date: parsedDate
        };

        this.app.sales.push(sale);
        this.app.dataManager.saveSales(this.app.sales);

        this.app.showNotification(`Venta histórica registrada: ${quantity} ${product.name} para el ${parsedDate}`, 'success');
        this.closeManualSaleModal();
        
        const currentHistoryDate = document.getElementById('historyDate').value;
        const historyParsedDate = this.app.utils.parseInputDateToLocal(currentHistoryDate);
        if (historyParsedDate === parsedDate) {
            this.loadHistory();
        }
        
        this.updateManagementStats();
        this.renderRecentSales();
    }
    
    showPeriodSearchModal() {
        document.getElementById('periodSearchModal').classList.remove('hidden');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        document.getElementById('periodStartDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('periodEndDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('periodSearchResults').innerHTML = '';
        
        this.populateProductFilter();
    }
    
    populateProductFilter() {
        const productSelect = document.getElementById('periodProductFilter');
        if (!productSelect) return;
        
        productSelect.innerHTML = '<option value="all">Todos los productos</option>';
        
        this.app.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Stock: ${product.stock})`;
            productSelect.appendChild(option);
        });
    }
    
    closePeriodSearchModal() {
        document.getElementById('periodSearchModal').classList.add('hidden');
        document.getElementById('periodSearchResults').innerHTML = '';
    }
}