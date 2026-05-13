// Módulo de Gestión de Datos - ACTUALIZADO CON AJUSTES MANUALES
class DataManager {
    constructor() {}
    
    loadProducts() {
        const stored = localStorage.getItem('salesSystem_products');
        if (stored) {
            return JSON.parse(stored);
        }
        
        return [
            { id: 1, name: 'Marlboro Rojo', category: 'cigars', purchasePrice: 45, salePrice: 50, stock: 100 },
            { id: 2, name: 'Camel Azul', category: 'cigars', purchasePrice: 40, salePrice: 45, stock: 80 },
            { id: 3, name: 'Jabón Líquido', category: 'cleaning', purchasePrice: 15, salePrice: 25, stock: 50 },
            { id: 4, name: 'Detergente', category: 'cleaning', purchasePrice: 20, salePrice: 30, stock: 40 },
            { id: 5, name: 'Cargador USB-C', category: 'phones', purchasePrice: 80, salePrice: 150, stock: 25 },
            { id: 6, name: 'Audífonos Inalámbricos', category: 'phones', purchasePrice: 120, salePrice: 250, stock: 15 },
            { id: 7, name: 'Funda Protectora', category: 'phones', purchasePrice: 25, salePrice: 60, stock: 30 },
            { id: 8, name: 'Cable Datos', category: 'phones', purchasePrice: 15, salePrice: 40, stock: 50 }
        ];
    }
    
    saveProducts(products) {
        localStorage.setItem('salesSystem_products', JSON.stringify(products));
    }
    
    loadSales() {
        const stored = localStorage.getItem('salesSystem_sales');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveSales(sales) {
        localStorage.setItem('salesSystem_sales', JSON.stringify(sales));
    }
    
    loadCategories() {
        const stored = localStorage.getItem('salesSystem_categories');
        if (stored) {
            return JSON.parse(stored);
        }
        
        return [
            { id: 'cigars', name: 'Cigarros', icon: 'fa-smoking', color: '#e74c3c', created: new Date().toISOString() },
            { id: 'cleaning', name: 'Limpieza', icon: 'fa-broom', color: '#3498db', created: new Date().toISOString() },
            { id: 'phones', name: 'Telefonía', icon: 'fa-mobile-alt', color: '#9b59b6', created: new Date().toISOString() }
        ];
    }
    
    saveCategories(categories) {
        localStorage.setItem('salesSystem_categories', JSON.stringify(categories));
    }
    
    loadPurchases() {
        const stored = localStorage.getItem('salesSystem_purchases');
        return stored ? JSON.parse(stored) : [];
    }
    
    savePurchases(purchases) {
        localStorage.setItem('salesSystem_purchases', JSON.stringify(purchases));
    }
    
    loadBudget() {
        const stored = localStorage.getItem('salesSystem_budget');
        return stored ? parseFloat(stored) : 0;
    }
    
    saveBudget(budget) {
        localStorage.setItem('salesSystem_budget', budget.toString());
    }
    
    getNextProductId(products) {
        if (products.length === 0) return 1;
        const maxId = Math.max(...products.map(p => p.id));
        return maxId + 1;
    }
    
    getNextCategoryId() {
        const categories = this.loadCategories();
        if (categories.length === 0) return 'cat1';
        
        let maxNum = 0;
        categories.forEach(cat => {
            if (cat.id.startsWith('cat')) {
                const num = parseInt(cat.id.substring(3));
                if (num > maxNum) maxNum = num;
            }
        });
        
        return `cat${maxNum + 1}`;
    }
    
    isCategoryInUse(categoryId) {
        const products = this.loadProducts();
        return products.some(p => p.category === categoryId);
    }
    
    getReinvestmentStats(products, sales, date = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const dailySales = sales.filter(sale => sale.date === targetDate);
        
        return {
            date: targetDate,
            totalSales: dailySales.length,
            totalAmount: dailySales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0),
            totalReinvestment: dailySales.reduce((sum, sale) => sum + (sale.quantity * sale.purchasePrice), 0),
            byProduct: {},
            byCategory: {}
        };
    }
    
    getPendingSyncData() {
        return {
            products: this.loadProducts(),
            sales: this.loadSales(),
            categories: this.loadCategories(),
            purchases: this.loadPurchases(),
            budget: this.loadBudget(),
            lastSync: localStorage.getItem('salesSystem_lastSync') || null
        };
    }
    
    setLastSync(timestamp) {
        localStorage.setItem('salesSystem_lastSync', timestamp);
    }
    
    importSyncedData(data) {
        if (data.products) localStorage.setItem('salesSystem_products', JSON.stringify(data.products));
        if (data.sales) localStorage.setItem('salesSystem_sales', JSON.stringify(data.sales));
        if (data.categories) localStorage.setItem('salesSystem_categories', JSON.stringify(data.categories));
        if (data.purchases) localStorage.setItem('salesSystem_purchases', JSON.stringify(data.purchases));
        if (data.budget !== undefined) localStorage.setItem('salesSystem_budget', data.budget.toString());
        if (data.lastSync) this.setLastSync(data.lastSync);
    }
}