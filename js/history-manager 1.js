// Módulo de Gestión de Historial y Búsquedas - CORREGIDO
class HistoryManager {
    constructor(app) {
        this.app = app;
    }
    
    loadHistory() {
        const dateInput = document.getElementById('historyDate');
        let selectedDate;
        
        console.log('Input value:', dateInput.value); // Para depuración
        
        if (dateInput.value) {
            // Usar el nuevo método para parsear correctamente
            selectedDate = this.app.utils.parseInputDateToLocal(dateInput.value);
        } else {
            selectedDate = this.app.currentDate;
            const today = new Date();
            const todayFormatted = today.toISOString().split('T')[0];
            dateInput.value = todayFormatted;
        }
        
        console.log('Fecha seleccionada (parseada):', selectedDate); // Para depuración
        console.log('Fecha actual del sistema:', this.app.currentDate); // Para depuración
        console.log('Total ventas:', this.app.sales.length); // Para depuración
        
        const container = document.getElementById('salesHistory');
        const daySales = this.app.sales.filter(sale => {
            console.log(`Venta: ${sale.date} - Comparando con: ${selectedDate}`); // Para depuración
            return sale.date === selectedDate;
        });
        
        console.log('Ventas encontradas:', daySales.length); // Para depuración
        
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
        const totalProfit = daySales.reduce((sum, sale) => sum + (sale.quantity * (sale.salePrice - sale.purchasePrice)), 0);
        const totalItems = daySales.reduce((sum, sale) => sum + sale.quantity, 0);
        
        container.innerHTML = `
            <div class="card">
                <h4>Resumen del ${displayDate}</h4>
                <div class="summary-mini">
                    <span><i class="fas fa-shopping-cart"></i> ${daySales.length} Ventas</span>
                    <span><i class="fas fa-cube"></i> ${totalItems} Artículos</span>
                    <span><i class="fas fa-money-bill"></i> $${totalAmount.toFixed(2)} Total</span>
                    <span><i class="fas fa-chart-line"></i> $${totalProfit.toFixed(2)} Ganancia</span>
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
                            
                            return `
                            <tr>
                                <td>${sale.productName}</td>
                                <td>
                                    <span class="category-badge category-${sale.category}">
                                        ${this.app.getCategoryName(sale.category)}
                                    </span>
                                </td>
                                <td>${sale.quantity}</td>
                                <td>$${sale.salePrice}</td>
                                <td>$${(sale.quantity * sale.salePrice).toFixed(2)}</td>
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
    
    // También corregir el método registerManualSale para usar parseInputDateToLocal
    registerManualSale() {
        const productId = document.getElementById('manualProductSelect').value;
        const quantity = parseInt(document.getElementById('manualQuantity').value);
        const salePrice = parseFloat(document.getElementById('manualSalePrice').value);
        const saleDate = document.getElementById('manualSaleDate').value;

        if (!productId || !quantity || !salePrice || !saleDate) {
            this.app.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        // Usar el nuevo método para parsear
        const parsedDate = this.app.utils.parseInputDateToLocal(saleDate);
        console.log('Fecha manual parseada:', parsedDate); // Para depuración
        
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
    
    // También corregir searchByPeriod
    searchByPeriod() {
        const startDate = document.getElementById('periodStartDate').value;
        const endDate = document.getElementById('periodEndDate').value;
        
        if (!startDate || !endDate) {
            this.app.showNotification('Por favor selecciona ambas fechas', 'error');
            return;
        }
        
        // Usar el nuevo método para parsear
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
        
        const periodSales = this.app.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= start && saleDate <= end;
        });
        
        this.renderPeriodResults(periodSales, parsedStartDate, parsedEndDate);
    }
    
    // Los demás métodos permanecen igual...
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
                    const date = new Date(sale.timestamp);
                    const formattedDate = date.toLocaleDateString('es-ES');
                    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    
                    return `
                        <div class="recent-sale-item">
                            <div class="recent-sale-info">
                                <div class="recent-sale-product">${sale.productName}</div>
                                <div class="recent-sale-details">
                                    <span>${formattedDate}</span>
                                    <span>${formattedTime}</span>
                                    <span>${sale.quantity} x $${sale.salePrice}</span>
                                    <span class="text-success">$${total.toFixed(2)}</span>
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
        const totalProfit = quantity * (salePrice - purchasePrice);

        document.getElementById('manualSaleTotal').textContent = `$${totalSale.toFixed(2)}`;
        document.getElementById('manualSaleProfit').textContent = `$${totalProfit.toFixed(2)}`;
    }
    
    showPeriodSearchModal() {
        document.getElementById('periodSearchModal').classList.remove('hidden');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        document.getElementById('periodStartDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('periodEndDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('periodSearchResults').innerHTML = '';
    }
    
    closePeriodSearchModal() {
        document.getElementById('periodSearchModal').classList.add('hidden');
        document.getElementById('periodSearchResults').innerHTML = '';
    }
//////////////////////////////////    
    renderPeriodResults(sales, startDate, endDate) {
        const container = document.getElementById('periodSearchResults');
        
        if (sales.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <p>No hay ventas registradas en el período seleccionado</p>
                </div>
            `;
            return;
        }
        
        const totalAmount = sales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.quantity * (sale.salePrice - sale.purchasePrice)), 0);
        const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        
        const salesByDate = {};
        sales.forEach(sale => {
            if (!salesByDate[sale.date]) {
                salesByDate[sale.date] = [];
            }
            salesByDate[sale.date].push(sale);
        });
        
        container.innerHTML = `
            <div class="card">
                <h4>Reporte del ${this.app.utils.formatDisplayDate(startDate)} al ${this.app.utils.formatDisplayDate(endDate)}</h4>
                <div class="summary-mini">
                    <span><i class="fas fa-shopping-cart"></i> ${sales.length} Ventas</span>
                    <span><i class="fas fa-cube"></i> ${totalItems} Artículos</span>
                    <span><i class="fas fa-money-bill"></i> $${totalAmount.toFixed(2)} Total</span>
                    <span><i class="fas fa-chart-line"></i> $${totalProfit.toFixed(2)} Ganancia</span>
                </div>
            </div>
            
            ${Object.entries(salesByDate).map(([date, daySales]) => {
                const dayTotal = daySales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
                const dayProfit = daySales.reduce((sum, sale) => sum + (sale.quantity * (sale.salePrice - sale.purchasePrice)), 0);
                const dayItems = daySales.reduce((sum, sale) => sum + sale.quantity, 0);
                
                return `
                    <div class="period-day-card mt-2">
                        <div class="period-day-header">
                            <div class="period-day-date">${this.app.utils.formatDisplayDate(date)}</div>
                            <div class="period-day-total">$${dayTotal.toFixed(2)}</div>
                        </div>
                        <div class="summary-mini">
                            <span>${daySales.length} ventas</span>
                            <span>${dayItems} artículos</span>
                            <span class="text-success">$${dayProfit.toFixed(2)} ganancia</span>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cant.</th>
                                    <th>Precio</th>
                                    <th>Total</th>
                                    <th>Hora</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${daySales.map(sale => `
                                    <tr>
                                        <td>${sale.productName}</td>
                                        <td>${sale.quantity}</td>
                                        <td>$${sale.salePrice}</td>
                                        <td>$${(sale.quantity * sale.salePrice).toFixed(2)}</td>
                                        <td>${new Date(sale.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>
                                            <button class="btn btn-small btn-danger" onclick="salesSystem.deleteSale(${sale.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }).join('')}
        `;
    }
}
