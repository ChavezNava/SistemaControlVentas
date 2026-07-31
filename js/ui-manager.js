// Módulo de Gestión de Interfaz de Usuario - OPTIMIZADO PARA MÓVILES
class UIManager {
    constructor(salesSystem) {
        this.salesSystem = salesSystem;
        this.isMobile = this.detectMobile();
        this.setupTouchEvents();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768;
    }
    
    setupTouchEvents() {
        // Prevenir zoom con doble toque
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    setupEventListeners() {
        // Formulario de venta
        document.getElementById('saleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salesSystem.salesManager.registerSale();
        });
        
        // Formulario de venta manual
        document.getElementById('manualSaleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salesSystem.historyManager.registerManualSale();
        });
        
        // Formulario de búsqueda por período
        document.getElementById('periodSearchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salesSystem.historyManager.searchByPeriod();
        });
        
        document.getElementById('productSelect').addEventListener('change', (e) => {
            this.salesSystem.salesManager.onProductSelectChange(e.target.value);
        });
        
        document.getElementById('manualProductSelect').addEventListener('change', (e) => {
            this.salesSystem.historyManager.onManualProductSelectChange(e.target.value);
        });
        
        document.getElementById('quantity').addEventListener('input', () => {
            this.salesSystem.salesManager.updateSaleSummary();
        });
        
        document.getElementById('salePrice').addEventListener('input', () => {
            this.salesSystem.salesManager.updateSaleSummary();
        });
        
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salesSystem.productManager.saveProduct();
        });
        
        document.getElementById('productSearch').addEventListener('input', (e) => {
            this.salesSystem.productManager.filterProducts(e.target.value);
        });
        
        document.getElementById('inventorySearch').addEventListener('input', (e) => {
            this.salesSystem.productManager.filterInventory(e.target.value);
        });
        
        document.getElementById('showManualSaleBtn').addEventListener('click', () => {
            this.salesSystem.historyManager.showManualSaleModal();
        });
        
        document.getElementById('showPeriodSearchBtn').addEventListener('click', () => {
            this.salesSystem.historyManager.showPeriodSearchModal();
        });
        
        document.getElementById('historyDate').addEventListener('change', () => {
            this.salesSystem.historyManager.loadHistory();
        });
        
        // Configurar filtro de categorías en inventario
        this.setupInventoryCategoryFilter();
        
    // Configurar filtro de categorías en inventario
    this.setupInventoryCategoryFilter();
    
    // Configurar eventos para compras si existen
    if (this.salesSystem.purchaseManager) {
        // Actualizar presupuesto cuando hay cambios
        this.salesSystem.purchaseManager.updateBudgetDisplay();
    }
    
        // Prevenir envío de formulario con Enter en móviles
        if (this.isMobile) {
            document.querySelectorAll('form').forEach(form => {
                form.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                    }
                });
            });
        }
        
        // Mejorar scroll en móviles
        this.improveMobileScroll();
    }
    
    improveMobileScroll() {
        if (!this.isMobile) return;
        
        // Mejorar scroll en listas
        document.querySelectorAll('.sales-list, .recent-sales, .modal-content').forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
        });
        
        // Prevenir bounce en iOS
        document.body.style.overscrollBehavior = 'none';
    }
    
    setupInventoryCategoryFilter() {
        const filterSelect = document.getElementById('categoryFilter');
        if (!filterSelect) return;
        
        filterSelect.innerHTML = '<option value="all">Todas</option>';
        
        // Agregar opciones dinámicamente
        this.salesSystem.getAllCategories().forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterSelect.appendChild(option);
        });
    }
    
    setupTabs() {
        document.querySelectorAll('[data-tab]').forEach(tab => {
            // Usar click para desktop, touch para móviles
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
            
            // Feedback táctil para móviles
            if (this.isMobile) {
                tab.addEventListener('touchstart', () => {
                    tab.style.opacity = '0.7';
                });
                tab.addEventListener('touchend', () => {
                    tab.style.opacity = '1';
                });
            }
        });
    }
    
    switchTab(tabName) {
        // Actualizar pestañas activas
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
            
            // Scroll a la pestaña si es necesario en móviles
            if (this.isMobile && activeTab.parentElement.scrollWidth > activeTab.parentElement.clientWidth) {
                activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        
        // Ocultar todos los contenidos
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Mostrar contenido activo
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
            
            // Scroll al top en móviles
            if (this.isMobile) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
        
        // Acciones específicas por pestaña
        if (tabName === 'summary') {
            this.salesSystem.updateSummary();
        } else if (tabName === 'products') {
            this.salesSystem.productManager.renderInventory();
            this.setupInventoryCategoryFilter();
        } else if (tabName === 'history') {
            this.salesSystem.historyManager.loadHistory();
        } else if (tabName === 'management') {
            this.salesSystem.historyManager.updateManagementStats();
            this.salesSystem.historyManager.renderRecentSales();
        }
    }
    
    updateDateDisplay() {
        const now = new Date();
        
        // Formato optimizado para móviles
        const dateOptions = this.isMobile ? {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        } : {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const timeOptions = this.isMobile ? {
            hour: '2-digit',
            minute: '2-digit'
        } : {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        document.getElementById('currentDate').textContent =
            now.toLocaleDateString('es-ES', dateOptions);
        document.getElementById('currentTime').textContent =
            now.toLocaleTimeString('es-ES', timeOptions);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notificationMessage');
        
        notification.className = `notification ${type}`;
        messageEl.textContent = message;
        notification.classList.remove('hidden');
        
        // Posición optimizada para móviles
        if (this.isMobile) {
            notification.style.top = '10px';
        }
        
        setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }
    
    hideNotification() {
        document.getElementById('notification').classList.add('hidden');
    }
    
    // Método para mostrar/ocultar botones flotantes según la pestaña
    updateMobileActions() {
        const mobileActions = document.querySelector('.mobile-action-buttons');
        if (!mobileActions) return;
        
        const activeTab = document.querySelector('[data-tab].active');
        if (activeTab) {
            const tabName = activeTab.getAttribute('data-tab');
            
            // Mostrar botones solo en ciertas pestañas
            if (tabName === 'sales' || tabName === 'management') {
                mobileActions.style.display = 'flex';
            } else {
                mobileActions.style.display = 'none';
            }
        }
    }
}
