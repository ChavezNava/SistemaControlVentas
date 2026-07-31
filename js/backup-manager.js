// Módulo de Respaldo y Restauración de Datos - CON SELECCIÓN DE UBICACIÓN Y CONFIRMACIÓN
class BackupManager {
    constructor(salesSystem) {
        this.salesSystem = salesSystem;
        this.backupKey = 'salesSystem_backup_history';
    }
    
    /**
     * Crear backup con selección de ubicación
     */
    async createBackupWithLocation(name = 'Backup Manual') {
        return new Promise((resolve, reject) => {
            const backup = this.prepareBackupData(name);
            
            // Mostrar modal de confirmación y selección de ubicación
            this.showBackupConfirmationModal(backup, (confirmed, location) => {
                if (confirmed) {
                    if (location === 'local') {
                        this.saveToLocalStorage(backup);
                        resolve(backup);
                    } else if (location === 'download') {
                        this.downloadBackupFile(backup);
                        resolve(backup);
                    }
                } else {
                    reject('Backup cancelado');
                }
            });
        });
    }
    
    /**
     * Preparar datos del backup
     */
    prepareBackupData(name) {
        const timestamp = new Date().toISOString();
        return {
            id: Date.now(),
            name: name,
            timestamp: timestamp,
            date: this.salesSystem.utils.getLocalDate(),
            products: JSON.parse(JSON.stringify(this.salesSystem.products)),
            sales: JSON.parse(JSON.stringify(this.salesSystem.sales)),
            categories: JSON.parse(JSON.stringify(this.salesSystem.categories)),
            purchases: JSON.parse(JSON.stringify(this.salesSystem.purchases || [])),
            budget: this.salesSystem.budget || 0,
            manualAdjustments: this.salesSystem.purchaseManager ? 
                JSON.parse(JSON.stringify(this.salesSystem.purchaseManager.manualAdjustments || [])) : [],
            version: '2.0',
            systemInfo: {
                totalProducts: this.salesSystem.products.length,
                totalSales: this.salesSystem.sales.length,
                totalPurchases: (this.salesSystem.purchases || []).length,
                totalCategories: this.salesSystem.categories.length,
                backupDate: new Date().toLocaleString('es-ES')
            }
        };
    }
    
    /**
     * Mostrar modal de confirmación con opciones de ubicación
     */
    showBackupConfirmationModal(backup, callback) {
        const modalHTML = `
            <div id="backupConfirmModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-database"></i>
                            Confirmar Respaldo
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="backup-info-summary">
                            <p><strong>Nombre:</strong> ${backup.name}</p>
                            <p><strong>Fecha:</strong> ${new Date(backup.timestamp).toLocaleString('es-ES')}</p>
                            <p><strong>Productos:</strong> ${backup.systemInfo.totalProducts}</p>
                            <p><strong>Ventas:</strong> ${backup.systemInfo.totalSales}</p>
                            <p><strong>Compras:</strong> ${backup.systemInfo.totalPurchases}</p>
                            <p><strong>Categorías:</strong> ${backup.systemInfo.totalCategories}</p>
                        </div>
                        
                        <div class="form-group mt-3">
                            <label for="backupLocation">Seleccionar ubicación de destino:</label>
                            <select id="backupLocation" class="form-control">
                                <option value="local">Guardar en el sistema (localStorage)</option>
                                <option value="download">Descargar archivo (.json)</option>
                            </select>
                            <small class="form-text text-muted">
                                <i class="fas fa-info-circle"></i> 
                                La opción "Descargar archivo" te permitirá guardar el backup en cualquier ubicación de tu dispositivo.
                            </small>
                        </div>
                        
                        <div class="backup-options mt-2" id="backupOptions">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="includeSystemInfo" checked>
                                    Incluir información del sistema
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="compressBackup">
                                    Comprimir archivo (optimizar tamaño)
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-actions mt-3">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('backupConfirmModal').remove()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" id="confirmBackupBtn">
                                <i class="fas fa-save"></i> Crear Respaldo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .backup-info-summary {
                    background: var(--light-color);
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .backup-info-summary p {
                    margin: 0.25rem 0;
                    font-size: 0.9rem;
                }
                .backup-options {
                    background: var(--light-color);
                    padding: 0.75rem;
                    border-radius: 8px;
                }
            </style>
        `;
        
        // Remover modal existente si existe
        const existingModal = document.getElementById('backupConfirmModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('backupConfirmModal');
        const confirmBtn = document.getElementById('confirmBackupBtn');
        const locationSelect = document.getElementById('backupLocation');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const location = locationSelect ? locationSelect.value : 'local';
                const includeSystemInfo = document.getElementById('includeSystemInfo')?.checked || true;
                
                // Si no incluir información del sistema, eliminar systemInfo del backup
                if (!includeSystemInfo && backup.systemInfo) {
                    delete backup.systemInfo;
                }
                
                modal.remove();
                callback(true, location);
            });
        }
        
        modal.classList.remove('hidden');
    }
    
    /**
     * Guardar backup en localStorage
     */
    saveToLocalStorage(backup) {
        const history = this.getBackupHistory();
        history.push(backup);
        
        // Mantener solo los últimos 10 backups
        if (history.length > 10) {
            history.shift();
        }
        
        localStorage.setItem(this.backupKey, JSON.stringify(history));
        this.salesSystem.showNotification(`Respaldo "${backup.name}" guardado en el sistema`, 'success');
        
        // Preguntar si también quiere descargar una copia
        this.askForAdditionalDownload(backup);
    }
    
    /**
     * Preguntar si desea una copia adicional descargable
     */
    askForAdditionalDownload(backup) {
        if (confirm('¿Deseas también descargar una copia del respaldo a tu dispositivo? Esto te permitirá tener una copia de seguridad externa.')) {
            this.downloadBackupFile(backup);
        }
    }
    
    /**
     * Descargar archivo de backup con selector de ubicación nativo
     */
    downloadBackupFile(backup) {
        // Preparar los datos para descarga
        let dataToExport = {
            timestamp: backup.timestamp,
            version: backup.version,
            info: 'Respaldo Sistema de Ventas',
            products: backup.products,
            sales: backup.sales,
            categories: backup.categories,
            purchases: backup.purchases,
            budget: backup.budget,
            manualAdjustments: backup.manualAdjustments
        };
        
        // Verificar si se debe incluir información del sistema
        if (backup.systemInfo) {
            dataToExport.systemInfo = backup.systemInfo;
        }
        
        let dataStr = JSON.stringify(dataToExport, null, 2);
        
        // Comprimir si es necesario (opcional)
        const shouldCompress = document.getElementById('compressBackup')?.checked;
        if (shouldCompress) {
            // Usar compresión simple (eliminar espacios en blanco)
            dataStr = JSON.stringify(dataToExport);
        }
        
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Crear URL del blob
        const url = URL.createObjectURL(dataBlob);
        
        // Crear elemento <a> para descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `respaldo_ventas_${new Date().toISOString().split('T')[0]}_${backup.name.replace(/\s+/g, '_')}.json`;
        
        // Agregar al DOM, hacer clic y remover
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Liberar URL del blob
        URL.revokeObjectURL(url);
        
        this.salesSystem.showNotification(`Respaldo descargado: ${a.download}`, 'success');
    }
    
    /**
     * Método original modificado para usar confirmación
     */
    createBackup(name = 'Backup Manual') {
        return this.createBackupWithLocation(name);
    }
    
    /**
     * Crear backup automático (sin confirmación)
     */
    createAutoBackup(name = 'Backup Automático') {
        const backup = this.prepareBackupData(name);
        this.saveToLocalStorage(backup);
        return backup;
    }
    
    /**
     * Restaurar backup con confirmación
     */
    restoreBackupWithConfirmation(backupId) {
        const history = this.getBackupHistory();
        const backup = history.find(b => b.id === backupId);
        
        if (!backup) {
            this.salesSystem.showNotification('Respaldo no encontrado', 'error');
            return false;
        }
        
        // Mostrar modal de confirmación de restauración
        this.showRestoreConfirmationModal(backup, (confirmed) => {
            if (confirmed) {
                this.performRestore(backup);
            }
        });
        
        return true;
    }
    
    /**
     * Mostrar modal de confirmación de restauración
     */
    showRestoreConfirmationModal(backup, callback) {
        const modalHTML = `
            <div id="restoreConfirmModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-exclamation-triangle"></i>
                            Confirmar Restauración
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning" style="background: var(--warning-color); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <i class="fas fa-exclamation-circle"></i>
                            <strong>¡Atención!</strong> Esta acción reemplazará todos los datos actuales.
                        </div>
                        
                        <div class="backup-info-summary">
                            <p><strong>Respaldo:</strong> ${backup.name}</p>
                            <p><strong>Creado:</strong> ${new Date(backup.timestamp).toLocaleString('es-ES')}</p>
                            <p><strong>Productos:</strong> ${backup.products.length}</p>
                            <p><strong>Ventas:</strong> ${backup.sales.length}</p>
                            <p><strong>Compras:</strong> ${(backup.purchases || []).length}</p>
                            <p><strong>Categorías:</strong> ${backup.categories.length}</p>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="createAutoBackupBeforeRestore" checked>
                                Crear backup automático antes de restaurar
                            </label>
                        </div>
                        
                        <div class="form-actions mt-3">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmRestoreBtn">
                                <i class="fas fa-redo"></i> Restaurar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('restoreConfirmModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('restoreConfirmModal');
        const confirmBtn = document.getElementById('confirmRestoreBtn');
        const createBackupCheck = document.getElementById('createAutoBackupBeforeRestore');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (createBackupCheck && createBackupCheck.checked) {
                    this.createAutoBackup('Auto-backup antes de restaurar');
                }
                modal.remove();
                callback(true);
            });
        }
        
        modal.classList.remove('hidden');
    }
    
    /**
     * Ejecutar la restauración
     */
    performRestore(backup) {
        try {
            this.salesSystem.products = JSON.parse(JSON.stringify(backup.products));
            this.salesSystem.sales = JSON.parse(JSON.stringify(backup.sales));
            this.salesSystem.categories = JSON.parse(JSON.stringify(backup.categories));
            this.salesSystem.purchases = backup.purchases || [];
            this.salesSystem.budget = backup.budget || 0;
            
            if (this.salesSystem.purchaseManager) {
                this.salesSystem.purchaseManager.manualAdjustments = backup.manualAdjustments || [];
                this.salesSystem.purchaseManager.saveManualAdjustments();
            }
            
            this.salesSystem.dataManager.saveProducts(this.salesSystem.products);
            this.salesSystem.dataManager.saveSales(this.salesSystem.sales);
            this.salesSystem.dataManager.saveCategories(this.salesSystem.categories);
            this.salesSystem.dataManager.savePurchases(this.salesSystem.purchases);
            this.salesSystem.dataManager.saveBudget(this.salesSystem.budget);
            
            // Actualizar todas las vistas
            this.salesSystem.productManager.renderProducts();
            this.salesSystem.productManager.renderProductSelect();
            this.salesSystem.productManager.renderInventory();
            this.salesSystem.salesManager.renderTodaySales();
            this.salesSystem.updateSummary();
            this.salesSystem.historyManager.updateManagementStats();
            this.salesSystem.historyManager.renderRecentSales();
            this.salesSystem.historyManager.loadHistory();
            
            if (this.salesSystem.purchaseManager) {
                this.salesSystem.purchaseManager.renderPurchaseHistory();
                this.salesSystem.purchaseManager.updateBudgetDisplay();
            }
            
            this.salesSystem.showNotification(`Sistema restaurado desde "${backup.name}"`, 'success');
        } catch (error) {
            console.error('Error restaurando respaldo:', error);
            this.salesSystem.showNotification('Error al restaurar el respaldo', 'error');
        }
    }
    
    /**
     * Exportar datos con selector de ubicación
     */
    exportDataWithLocation() {
        const data = {
            timestamp: new Date().toISOString(),
            version: '2.0',
            info: 'Respaldo Sistema de Ventas',
            products: this.salesSystem.products,
            sales: this.salesSystem.sales,
            categories: this.salesSystem.categories,
            purchases: this.salesSystem.purchases || [],
            budget: this.salesSystem.budget || 0,
            manualAdjustments: this.salesSystem.purchaseManager ? 
                this.salesSystem.purchaseManager.manualAdjustments || [] : []
        };
        
        // Usar el diálogo nativo de guardar archivo
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `exportacion_ventas_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.salesSystem.showNotification('Datos exportados correctamente', 'success');
    }
    
    /**
     * Exportar datos (método original)
     */
    exportData() {
        this.exportDataWithLocation();
    }
    
    /**
     * Importar datos con confirmación
     */
    importDataWithConfirmation(file) {
        if (!file) return;
        
        // Mostrar modal de confirmación antes de importar
        this.showImportConfirmationModal(file);
    }
    
    /**
     * Mostrar modal de confirmación de importación
     */
    showImportConfirmationModal(file) {
        const modalHTML = `
            <div id="importConfirmModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-exclamation-triangle"></i>
                            Confirmar Importación
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning" style="background: var(--warning-color); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <i class="fas fa-exclamation-circle"></i>
                            <strong>¡Atención!</strong> La importación reemplazará todos los datos actuales.
                        </div>
                        
                        <p><strong>Archivo seleccionado:</strong> ${file.name}</p>
                        <p><strong>Tamaño:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="createBackupBeforeImport" checked>
                                Crear backup automático antes de importar
                            </label>
                        </div>
                        
                        <div class="form-actions mt-3">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" id="confirmImportBtn">
                                <i class="fas fa-upload"></i> Importar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('importConfirmModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('importConfirmModal');
        const confirmBtn = document.getElementById('confirmImportBtn');
        const createBackupCheck = document.getElementById('createBackupBeforeImport');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (createBackupCheck && createBackupCheck.checked) {
                    this.createAutoBackup('Auto-backup antes de importar');
                }
                modal.remove();
                this.performImport(file);
            });
        }
        
        modal.classList.remove('hidden');
    }
    
    /**
     * Ejecutar la importación
     */
    performImport(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.products || !data.sales || !data.categories) {
                    throw new Error('Formato de archivo inválido');
                }
                
                this.salesSystem.products = data.products;
                this.salesSystem.sales = data.sales;
                this.salesSystem.categories = data.categories;
                this.salesSystem.purchases = data.purchases || [];
                this.salesSystem.budget = data.budget || 0;
                
                if (this.salesSystem.purchaseManager) {
                    this.salesSystem.purchaseManager.manualAdjustments = data.manualAdjustments || [];
                    this.salesSystem.purchaseManager.saveManualAdjustments();
                }
                
                this.salesSystem.dataManager.saveProducts(this.salesSystem.products);
                this.salesSystem.dataManager.saveSales(this.salesSystem.sales);
                this.salesSystem.dataManager.saveCategories(this.salesSystem.categories);
                this.salesSystem.dataManager.savePurchases(this.salesSystem.purchases);
                this.salesSystem.dataManager.saveBudget(this.salesSystem.budget);
                
                this.salesSystem.productManager.renderProducts();
                this.salesSystem.productManager.renderProductSelect();
                this.salesSystem.productManager.renderInventory();
                this.salesSystem.salesManager.renderTodaySales();
                this.salesSystem.updateSummary();
                this.salesSystem.historyManager.updateManagementStats();
                this.salesSystem.historyManager.renderRecentSales();
                this.salesSystem.historyManager.loadHistory();
                
                if (this.salesSystem.purchaseManager) {
                    this.salesSystem.purchaseManager.renderPurchaseHistory();
                    this.salesSystem.purchaseManager.updateBudgetDisplay();
                }
                
                this.salesSystem.showNotification('Datos importados correctamente', 'success');
            } catch (error) {
                console.error('Error importando datos:', error);
                this.salesSystem.showNotification('Error al importar datos. Formato inválido.', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Importar datos (método original)
     */
    importData(file) {
        this.importDataWithConfirmation(file);
    }
    
    /**
     * Obtener historial de backups
     */
    getBackupHistory() {
        const stored = localStorage.getItem(this.backupKey);
        return stored ? JSON.parse(stored) : [];
    }
    
    /**
     * Eliminar backup con confirmación
     */
    deleteBackupWithConfirmation(backupId) {
        const history = this.getBackupHistory();
        const backup = history.find(b => b.id === backupId);
        
        if (!backup) {
            this.salesSystem.showNotification('Respaldo no encontrado', 'error');
            return false;
        }
        
        if (confirm(`¿Estás seguro de eliminar el respaldo "${backup.name}"?`)) {
            const filteredHistory = history.filter(b => b.id !== backupId);
            localStorage.setItem(this.backupKey, JSON.stringify(filteredHistory));
            this.salesSystem.showNotification('Respaldo eliminado', 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Eliminar backup (método original)
     */
    deleteBackup(backupId) {
        return this.deleteBackupWithConfirmation(backupId);
    }
    
    /**
     * Mostrar gestor de backups
     */
    showBackupManagerModal() {
        const modalHTML = `
            <div id="backupManagerModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-database"></i>
                            Gestión de Respaldo y Restauración
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="grid-2 mb-3">
                            <div class="card">
                                <h4 class="card-subtitle">
                                    <i class="fas fa-save"></i>
                                    Crear Respaldo
                                </h4>
                                <div class="form-group">
                                    <input type="text" id="backupName" placeholder="Nombre del respaldo" class="form-control" value="Backup ${new Date().toLocaleDateString()}">
                                </div>
                                <button class="btn btn-primary full-width-mobile" id="createBackupBtn">
                                    <i class="fas fa-plus-circle"></i> Crear Respaldo
                                </button>
                                <small class="form-text text-muted mt-1">
                                    <i class="fas fa-info-circle"></i> Se te pedirá confirmación y podrás elegir dónde guardarlo
                                </small>
                            </div>
                            
                            <div class="card">
                                <h4 class="card-subtitle">
                                    <i class="fas fa-file-export"></i>
                                    Exportar/Importar
                                </h4>
                                <div class="tool-grid">
                                    <button class="btn btn-success" id="exportDataBtn">
                                        <i class="fas fa-download"></i> Exportar
                                    </button>
                                    <label class="btn btn-info" style="cursor: pointer;">
                                        <i class="fas fa-upload"></i> Importar
                                        <input type="file" accept=".json" style="display: none;" id="importFileInput">
                                    </label>
                                </div>
                                <small class="form-text text-muted mt-1">
                                    <i class="fas fa-info-circle"></i> Exportar: guarda en tu dispositivo | Importar: con confirmación previa
                                </small>
                            </div>
                        </div>
                        
                        <h4 class="card-subtitle mt-3">
                            <i class="fas fa-history"></i>
                            Historial de Respaldos
                        </h4>
                        <div id="backupHistoryList">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('backupManagerModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.renderBackupHistory();
        
        // Configurar eventos
        const createBackupBtn = document.getElementById('createBackupBtn');
        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', async () => {
                const backupName = document.getElementById('backupName')?.value || 'Backup Manual';
                try {
                    await this.createBackupWithLocation(backupName);
                    this.renderBackupHistory();
                } catch (error) {
                    console.log('Backup cancelado o error:', error);
                }
            });
        }
        
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportDataWithLocation();
            });
        }
        
        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.importDataWithConfirmation(e.target.files[0]);
                    importFileInput.value = '';
                }
            });
        }
        
        const modal = document.getElementById('backupManagerModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    /**
     * Renderizar historial de backups
     */
    renderBackupHistory() {
        const container = document.getElementById('backupHistoryList');
        const history = this.getBackupHistory();
        
        if (history.length === 0) {
            container.innerHTML = '<div class="text-center">No hay respaldos guardados</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Fecha</th>
                            <th>Productos</th>
                            <th>Ventas</th>
                            <th>Compras</th>
                            <th>Ajustes</th>
                            <th>Categorías</th>
                            <th>Acciones</th>
                        </thead>
                    <tbody>
                        ${history.slice().reverse().map(backup => {
                            const date = new Date(backup.timestamp);
                            const formattedDate = date.toLocaleDateString('es-ES') + ' ' + 
                                                date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            const adjustmentsCount = (backup.manualAdjustments || []).length;
                            
                            return `
                                 <tr>
                                    <td>${backup.name}</td>
                                    <td>${formattedDate}</td>
                                    <td>${backup.products.length}</td>
                                    <td>${backup.sales.length}</td>
                                    <td>${(backup.purchases || []).length}</td>
                                    <td>${adjustmentsCount}</td>
                                    <td>${backup.categories.length}</td>
                                    <td>
                                        <button class="btn btn-small btn-success" 
                                                onclick="window.salesSystem.backupManager.restoreBackupWithConfirmation(${backup.id})">
                                            <i class="fas fa-redo"></i>
                                        </button>
                                        <button class="btn btn-small btn-danger" 
                                                onclick="if(window.salesSystem.backupManager.deleteBackupWithConfirmation(${backup.id})) { window.salesSystem.backupManager.showBackupManagerModal(); }">
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
    
    /**
     * Generar reporte de backups
     */
    generateBackupReport() {
        const history = this.getBackupHistory();
        if (history.length === 0) {
            return 'No hay respaldos disponibles';
        }
        
        const report = {
            totalBackups: history.length,
            latestBackup: history[history.length - 1],
            backupSizes: history.map(b => ({
                name: b.name,
                products: b.products.length,
                sales: b.sales.length,
                purchases: (b.purchases || []).length,
                adjustments: (b.manualAdjustments || []).length,
                categories: b.categories.length
            }))
        };
        
        return report;
    }
}
