// Módulo de Gestión de Categorías - OPTIMIZADO PARA MÓVILES
class CategoryManager {
    constructor(salesSystem) {
        this.salesSystem = salesSystem;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    getAllCategories() {
        return this.salesSystem.getAllCategories();
    }
    
    renderCategoryTabs() {
        const tabsContainer = document.querySelector('.tabs[data-category-container]');
        if (!tabsContainer) {
            console.error('Contenedor de pestañas de categorías no encontrado');
            return;
        }
        
        // Limpiar contenedor
        tabsContainer.innerHTML = '';
        
        // Obtener todas las categorías
        const allCategories = this.getAllCategories();
        
        // Crear pestaña para cada categoría
        allCategories.forEach(category => {
            const tab = document.createElement('div');
            tab.className = 'tab';
            tab.setAttribute('data-category', category.id);
            tab.innerHTML = `
                <i class="fas ${category.icon}"></i>
                <span class="tab-text">${category.name}</span>
            `;
            
            // Evento táctil optimizado
            if (this.isMobile) {
                tab.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    tab.style.opacity = '0.7';
                });
                
                tab.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    tab.style.opacity = '1';
                    this.switchProductCategory(category.id);
                });
            } else {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchProductCategory(category.id);
                });
            }
            
            tabsContainer.appendChild(tab);
        });
        
        // Agregar pestaña "Todos"
        const allTab = document.createElement('div');
        allTab.className = 'tab active';
        allTab.setAttribute('data-category', 'all');
        allTab.innerHTML = `
            <i class="fas fa-list"></i>
            <span class="tab-text">Todos</span>
        `;
        
        if (this.isMobile) {
            allTab.addEventListener('touchstart', (e) => {
                e.preventDefault();
                allTab.style.opacity = '0.7';
            });
            
            allTab.addEventListener('touchend', (e) => {
                e.preventDefault();
                allTab.style.opacity = '1';
                this.switchProductCategory('all');
            });
        } else {
            allTab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchProductCategory('all');
            });
        }
        
        tabsContainer.appendChild(allTab);
        
        // Agregar botón para gestionar categorías (solo en desktop)
        if (!this.isMobile) {
            const manageTab = document.createElement('div');
            manageTab.className = 'tab';
            manageTab.setAttribute('data-category', 'manage');
            manageTab.innerHTML = '<i class="fas fa-cog"></i><span class="tab-text">Gestionar</span>';
            manageTab.addEventListener('click', (e) => {
                e.preventDefault();
                this.showManageCategoriesModal();
            });
            tabsContainer.appendChild(manageTab);
        }
        
        // Crear contenedores para cada categoría
        this.createProductGrids(allCategories);
        
        // Activar la primera categoría
        if (allCategories.length > 0) {
            this.switchProductCategory('all');
        }
    }
    
    createProductGrids(categories) {
        const salesTab = document.getElementById('sales-tab');
        const productCard = salesTab ? salesTab.querySelector('.card') : null;
        
        if (!productCard) return;
        
        // Eliminar grids existentes
        const existingGrids = productCard.querySelectorAll('.product-grid');
        existingGrids.forEach(grid => {
            if (grid.id !== 'all-products') {
                grid.remove();
            }
        });
        
        // Crear grid para "Todos" si no existe
        let allGrid = document.getElementById('all-products');
        if (!allGrid) {
            allGrid = document.createElement('div');
            allGrid.id = 'all-products';
            allGrid.className = 'product-grid active';
            productCard.appendChild(allGrid);
        }
        
        // Crear grids para cada categoría
        categories.forEach(category => {
            const grid = document.createElement('div');
            grid.id = `${category.id}-products`;
            grid.className = 'product-grid';
            productCard.appendChild(grid);
        });
    }
    
    switchProductCategory(categoryId) {
        // Actualizar pestañas activas
        document.querySelectorAll('[data-category]').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-category="${categoryId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
            
            // Scroll a la pestaña si es necesario en móviles
            if (this.isMobile && activeTab.parentElement && activeTab.parentElement.scrollWidth > activeTab.parentElement.clientWidth) {
                activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        
        // Ocultar todos los grids
        document.querySelectorAll('.product-grid').forEach(grid => {
            grid.style.display = 'none';
            grid.classList.remove('active');
        });
        
        // Mostrar grid de la categoría seleccionada
        const targetGrid = document.getElementById(`${categoryId}-products`);
        if (targetGrid) {
            targetGrid.style.display = 'grid';
            targetGrid.classList.add('active');
        }
        
        // Forzar re-filtrado si hay búsqueda activa
        const searchTerm = document.getElementById('productSearch');
        if (searchTerm && searchTerm.value) {
            this.salesSystem.productManager.filterProducts(searchTerm.value);
        } else {
            // Renderizar productos normalmente
            this.salesSystem.productManager.renderProducts();
        }
    }
    
    showManageCategoriesModal() {
        // En móviles, mostrar una versión simplificada
        if (this.isMobile) {
            this.showMobileCategoriesModal();
            return;
        }
        
        const modal = document.getElementById('manageCategoriesModal');
        if (!modal) {
            this.createManageCategoriesModal();
        } else {
            modal.classList.remove('hidden');
        }
        
        this.renderCategoriesList();
    }
    
    showMobileCategoriesModal() {
        const allCategories = this.getAllCategories();
        
        const modalHTML = `
            <div id="mobileCategoriesModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-tags"></i>
                            <span>Categorías</span>
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <button class="btn btn-success full-width-mobile" onclick="window.salesSystem.categoryManager.showAddCategoryModal()">
                                <i class="fas fa-plus"></i> Nueva Categoría
                            </button>
                        </div>
                        
                        <div class="categories-list-mobile">
                            ${allCategories.map(category => {
                                const productCount = this.salesSystem.products.filter(p => p.category === category.id).length;
                                return `
                                    <div class="category-item-mobile">
                                        <div class="category-item-header">
                                            <div class="category-color" style="background: ${category.color}"></div>
                                            <div class="category-info">
                                                <div class="category-name">${category.name}</div>
                                                <div class="category-icon"><i class="fas ${category.icon}"></i></div>
                                            </div>
                                            <div class="category-stats">${productCount} productos</div>
                                        </div>
                                        <div class="category-item-actions">
                                            <button class="btn btn-small btn-info" onclick="window.salesSystem.categoryManager.editCategory('${category.id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            ${productCount === 0 ? `
                                                <button class="btn btn-small btn-danger" onclick="window.salesSystem.categoryManager.deleteCategory('${category.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .categories-list-mobile { display: flex; flex-direction: column; gap: 0.75rem; }
                .category-item-mobile { 
                    background: var(--light-color); 
                    border: 1px solid var(--border-color); 
                    border-radius: 8px; 
                    padding: 0.75rem; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 0.75rem; 
                }
                .category-item-header { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.75rem; 
                }
                .category-color { 
                    width: 24px; 
                    height: 24px; 
                    border-radius: 6px; 
                    flex-shrink: 0; 
                }
                .category-info { 
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 0.2rem; 
                }
                .category-name { 
                    font-weight: 600; 
                    font-size: 0.95rem; 
                }
                .category-icon { 
                    font-size: 0.8rem; 
                    color: #666; 
                }
                .category-stats { 
                    font-size: 0.8rem; 
                    color: #666; 
                    flex-shrink: 0; 
                }
                .category-item-actions { 
                    display: flex; 
                    gap: 0.5rem; 
                    justify-content: flex-end; 
                }
            </style>
        `;
        
        // Remover modal existente si hay
        const existingModal = document.getElementById('mobileCategoriesModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = document.getElementById('mobileCategoriesModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    createManageCategoriesModal() {
        const modalHTML = `
            <div id="manageCategoriesModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-tags"></i>
                            Gestionar Categorías
                        </h3>
                        <button class="modal-close" onclick="window.salesSystem.categoryManager.closeManageCategoriesModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <button class="btn btn-success" onclick="window.salesSystem.categoryManager.showAddCategoryModal()">
                                <i class="fas fa-plus"></i> Nueva Categoría
                            </button>
                        </div>
                        
                        <div id="categoriesList">
                            <!-- Lista de categorías se cargará aquí -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    closeManageCategoriesModal() {
        const modal = document.getElementById('manageCategoriesModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const mobileModal = document.getElementById('mobileCategoriesModal');
        if (mobileModal) {
            mobileModal.remove();
        }
    }
    
    renderCategoriesList() {
        const container = document.getElementById('categoriesList');
        if (!container) return;
        
        const categories = this.getAllCategories();
        
        if (categories.length === 0) {
            container.innerHTML = '<div class="text-center">No hay categorías definidas</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="card">
                <h4 class="card-subtitle">Categorías Existentes</h4>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Color</th>
                                <th>Icono</th>
                                <th>Productos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categories.map(category => {
                                const productCount = this.salesSystem.products.filter(p => p.category === category.id).length;
                                const isInUse = productCount > 0;
                                
                                return `
                                    <tr>
                                        <td>
                                            <span class="category-badge" style="background: ${category.color}">
                                                ${category.name}
                                            </span>
                                        </td>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                <div style="width: 20px; height: 20px; background: ${category.color}; border-radius: 4px;"></div>
                                                <span>${category.color}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <i class="fas ${category.icon}"></i>
                                        </td>
                                        <td>${productCount}</td>
                                        <td>
                                            <button class="btn btn-small btn-info" onclick="window.salesSystem.categoryManager.editCategory('${category.id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-small btn-danger" 
                                                    onclick="window.salesSystem.categoryManager.deleteCategory('${category.id}')"
                                                    ${isInUse ? 'disabled title="No se puede eliminar porque tiene productos asociados"' : ''}>
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
    
    showAddCategoryModal() {
        // Versión móvil simplificada
        if (this.isMobile) {
            this.showMobileAddCategoryModal();
            return;
        }
        
        const modalHTML = `
            <div id="addCategoryModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-plus-circle"></i>
                            Nueva Categoría
                        </h3>
                        <button class="modal-close" onclick="window.salesSystem.categoryManager.closeAddCategoryModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="addCategoryForm">
                            <div class="form-group">
                                <label for="newCategoryName">Nombre *</label>
                                <input type="text" id="newCategoryName" required class="form-control" placeholder="Ej: Bebidas">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="newCategoryColor">Color *</label>
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <input type="color" id="newCategoryColor" value="#3498db" required class="form-control" style="height: 40px; width: 60px; padding: 0; flex-shrink: 0;">
                                        <input type="text" id="newCategoryColorText" value="#3498db" class="form-control" style="flex: 1;" readonly>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="newCategoryIcon">Icono *</label>
                                    <select id="newCategoryIcon" required class="form-control">
                                        <option value="fa-tag">Etiqueta</option>
                                        <option value="fa-smoking">Cigarro</option>
                                        <option value="fa-broom">Escoba</option>
                                        <option value="fa-mobile-alt">Teléfono</option>
                                        <option value="fa-glass-whiskey">Vaso</option>
                                        <option value="fa-cookie">Galleta</option>
                                        <option value="fa-candy-cane">Caramelo</option>
                                        <option value="fa-tshirt">Camiseta</option>
                                        <option value="fa-plug">Electrónico</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="window.salesSystem.categoryManager.closeAddCategoryModal()">
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
            
            <script>
                // Sincronizar input color con text
                document.getElementById('newCategoryColor').addEventListener('input', function() {
                    document.getElementById('newCategoryColorText').value = this.value;
                });
            </script>
        `;
        
        // Remover modal existente si hay
        const existingModal = document.getElementById('addCategoryModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Agregar event listener al formulario
        const form = document.getElementById('addCategoryForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewCategory();
            });
        }
        
        // Mostrar modal
        const modal = document.getElementById('addCategoryModal');
        if (modal) modal.classList.remove('hidden');
        
        // Enfocar el input en móviles
        if (this.isMobile) {
            setTimeout(() => {
                const nameInput = document.getElementById('newCategoryName');
                if (nameInput) nameInput.focus();
            }, 300);
        }
    }
    
    showMobileAddCategoryModal() {
        const modalHTML = `
            <div id="mobileAddCategoryModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-plus-circle"></i>
                            Nueva Categoría
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="mobileAddCategoryForm">
                            <div class="form-group">
                                <label for="mobileCategoryName">Nombre *</label>
                                <input type="text" id="mobileCategoryName" required class="form-control" placeholder="Ej: Bebidas">
                            </div>
                            
                            <div class="form-group">
                                <label for="mobileCategoryColor">Color *</label>
                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    <input type="color" id="mobileCategoryColor" value="#3498db" required class="form-control" style="height: 50px;">
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                        <div style="width: 30px; height: 30px; background: #e74c3c; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileCategoryColor').value = '#e74c3c'"></div>
                                        <div style="width: 30px; height: 30px; background: #3498db; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileCategoryColor').value = '#3498db'"></div>
                                        <div style="width: 30px; height: 30px; background: #9b59b6; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileCategoryColor').value = '#9b59b6'"></div>
                                        <div style="width: 30px; height: 30px; background: #f39c12; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileCategoryColor').value = '#f39c12'"></div>
                                        <div style="width: 30px; height: 30px; background: #27ae60; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileCategoryColor').value = '#27ae60'"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="mobileCategoryIcon">Icono *</label>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 0.5rem;">
                                    <label style="display: flex; flex-direction: column; align-items: center; padding: 0.5rem; border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                                        <input type="radio" name="mobileCategoryIcon" value="fa-tag" checked hidden>
                                        <i class="fas fa-tag" style="font-size: 1.2rem; margin-bottom: 0.25rem;"></i>
                                        <span style="font-size: 0.8rem;">Etiqueta</span>
                                    </label>
                                    <label style="display: flex; flex-direction: column; align-items: center; padding: 0.5rem; border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                                        <input type="radio" name="mobileCategoryIcon" value="fa-broom" hidden>
                                        <i class="fas fa-broom" style="font-size: 1.2rem; margin-bottom: 0.25rem;"></i>
                                        <span style="font-size: 0.8rem;">Escoba</span>
                                    </label>
                                    <label style="display: flex; flex-direction: column; align-items: center; padding: 0.5rem; border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                                        <input type="radio" name="mobileCategoryIcon" value="fa-mobile-alt" hidden>
                                        <i class="fas fa-mobile-alt" style="font-size: 1.2rem; margin-bottom: 0.25rem;"></i>
                                        <span style="font-size: 0.8rem;">Teléfono</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-actions" style="margin-top: 1.5rem;">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si hay
        const existingModal = document.getElementById('mobileAddCategoryModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Agregar event listener al formulario
        const form = document.getElementById('mobileAddCategoryForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMobileNewCategory();
            });
        }
        
        // Mostrar modal
        const modal = document.getElementById('mobileAddCategoryModal');
        if (modal) modal.classList.remove('hidden');
        
        // Enfocar el input
        setTimeout(() => {
            const nameInput = document.getElementById('mobileCategoryName');
            if (nameInput) nameInput.focus();
        }, 300);
    }
    
    saveMobileNewCategory() {
        const name = document.getElementById('mobileCategoryName')?.value.trim();
        const color = document.getElementById('mobileCategoryColor')?.value;
        const iconRadio = document.querySelector('input[name="mobileCategoryIcon"]:checked');
        const icon = iconRadio ? iconRadio.value : 'fa-tag';
        
        if (!name) {
            this.salesSystem.showNotification('Por favor ingresa un nombre', 'error');
            return;
        }
        
        // Generar ID automático
        const id = name.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .substring(0, 20);
        
        // Verificar si el ID ya existe
        const existingCategory = this.salesSystem.categories.find(c => c.id === id);
        if (existingCategory) {
            this.salesSystem.showNotification('Ya existe una categoría con ese nombre', 'error');
            return;
        }
        
        const newCategory = {
            id: id,
            name: name,
            color: color,
            icon: icon,
            created: new Date().toISOString()
        };
        
        this.salesSystem.addCategory(newCategory);
        
        // Cerrar modales
        const modal = document.getElementById('mobileAddCategoryModal');
        if (modal) modal.remove();
        
        const mobileModal = document.getElementById('mobileCategoriesModal');
        if (mobileModal) mobileModal.remove();
    }
    
    closeAddCategoryModal() {
        const modal = document.getElementById('addCategoryModal');
        if (modal) {
            modal.remove();
        }
        
        const mobileModal = document.getElementById('mobileAddCategoryModal');
        if (mobileModal) {
            mobileModal.remove();
        }
    }
    
    saveNewCategory() {
        const name = document.getElementById('newCategoryName')?.value.trim();
        const color = document.getElementById('newCategoryColor')?.value;
        const icon = document.getElementById('newCategoryIcon')?.value;
        
        if (!name || !color || !icon) {
            this.salesSystem.showNotification('Por favor completa todos los campos', 'error');
            return;
        }
        
        // Generar ID automático
        const id = name.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .substring(0, 20);
        
        // Verificar si el ID ya existe
        const existingCategory = this.salesSystem.categories.find(c => c.id === id);
        if (existingCategory) {
            this.salesSystem.showNotification('Ya existe una categoría con ese nombre', 'error');
            return;
        }
        
        const newCategory = {
            id: id,
            name: name,
            color: color,
            icon: icon,
            created: new Date().toISOString()
        };
        
        this.salesSystem.addCategory(newCategory);
        this.closeAddCategoryModal();
        this.closeManageCategoriesModal();
    }
    
    editCategory(categoryId) {
        const category = this.salesSystem.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        // Versión móvil simplificada
        if (this.isMobile) {
            this.showMobileEditCategoryModal(category);
            return;
        }
        
        const modalHTML = `
            <div id="editCategoryModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-edit"></i>
                            Editar: ${category.name}
                        </h3>
                        <button class="modal-close" onclick="window.salesSystem.categoryManager.closeEditCategoryModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="editCategoryForm">
                            <input type="hidden" id="editCategoryId" value="${category.id}">
                            
                            <div class="form-group">
                                <label for="editCategoryName">Nombre *</label>
                                <input type="text" id="editCategoryName" value="${category.name}" required class="form-control">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="editCategoryColor">Color *</label>
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <input type="color" id="editCategoryColor" value="${category.color}" required class="form-control" style="height: 40px; width: 60px; padding: 0; flex-shrink: 0;">
                                        <input type="text" id="editCategoryColorText" value="${category.color}" class="form-control" style="flex: 1;" readonly>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editCategoryIcon">Icono *</label>
                                    <select id="editCategoryIcon" required class="form-control">
                                        <option value="fa-tag" ${category.icon === 'fa-tag' ? 'selected' : ''}>Etiqueta</option>
                                        <option value="fa-smoking" ${category.icon === 'fa-smoking' ? 'selected' : ''}>Cigarro</option>
                                        <option value="fa-broom" ${category.icon === 'fa-broom' ? 'selected' : ''}>Escoba</option>
                                        <option value="fa-mobile-alt" ${category.icon === 'fa-mobile-alt' ? 'selected' : ''}>Teléfono</option>
                                        <option value="fa-glass-whiskey" ${category.icon === 'fa-glass-whiskey' ? 'selected' : ''}>Vaso</option>
                                        <option value="fa-cookie" ${category.icon === 'fa-cookie' ? 'selected' : ''}>Galleta</option>
                                        <option value="fa-candy-cane" ${category.icon === 'fa-candy-cane' ? 'selected' : ''}>Caramelo</option>
                                        <option value="fa-tshirt" ${category.icon === 'fa-tshirt' ? 'selected' : ''}>Camiseta</option>
                                        <option value="fa-plug" ${category.icon === 'fa-plug' ? 'selected' : ''}>Electrónico</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="window.salesSystem.categoryManager.closeEditCategoryModal()">
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
            
            <script>
                // Sincronizar input color con text
                document.getElementById('editCategoryColor').addEventListener('input', function() {
                    document.getElementById('editCategoryColorText').value = this.value;
                });
            </script>
        `;
        
        // Remover modal existente si hay
        const existingModal = document.getElementById('editCategoryModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Agregar event listener al formulario
        const form = document.getElementById('editCategoryForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCategoryChanges(categoryId);
            });
        }
        
        // Mostrar modal
        const modal = document.getElementById('editCategoryModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    showMobileEditCategoryModal(category) {
        const modalHTML = `
            <div id="mobileEditCategoryModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-edit"></i>
                            Editar: ${category.name}
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="mobileEditCategoryForm">
                            <input type="hidden" id="mobileEditCategoryId" value="${category.id}">
                            
                            <div class="form-group">
                                <label for="mobileEditCategoryName">Nombre *</label>
                                <input type="text" id="mobileEditCategoryName" value="${category.name}" required class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <label for="mobileEditCategoryColor">Color *</label>
                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    <input type="color" id="mobileEditCategoryColor" value="${category.color}" required class="form-control" style="height: 50px;">
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                        <div style="width: 30px; height: 30px; background: #e74c3c; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileEditCategoryColor').value = '#e74c3c'"></div>
                                        <div style="width: 30px; height: 30px; background: #3498db; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileEditCategoryColor').value = '#3498db'"></div>
                                        <div style="width: 30px; height: 30px; background: #9b59b6; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileEditCategoryColor').value = '#9b59b6'"></div>
                                        <div style="width: 30px; height: 30px; background: #f39c12; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileEditCategoryColor').value = '#f39c12'"></div>
                                        <div style="width: 30px; height: 30px; background: #27ae60; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('mobileEditCategoryColor').value = '#27ae60'"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="mobileEditCategoryIcon">Icono *</label>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 0.5rem;">
                                    <label style="display: flex; flex-direction: column; align-items: center; padding: 0.5rem; border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                                        <input type="radio" name="mobileEditCategoryIcon" value="fa-tag" ${category.icon === 'fa-tag' ? 'checked' : ''} hidden>
                                        <i class="fas fa-tag" style="font-size: 1.2rem; margin-bottom: 0.25rem;"></i>
                                        <span style="font-size: 0.8rem;">Etiqueta</span>
                                    </label>
                                    <label style="display: flex; flex-direction: column; align-items: center; padding: 0.5rem; border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                                        <input type="radio" name="mobileEditCategoryIcon" value="fa-broom" ${category.icon === 'fa-broom' ? 'checked' : ''} hidden>
                                        <i class="fas fa-broom" style="font-size: 1.2rem; margin-bottom: 0.25rem;"></i>
                                        <span style="font-size: 0.8rem;">Escoba</span>
                                    </label>
                                    <label style="display: flex; flex-direction: column; align-items: center; padding: 0.5rem; border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                                        <input type="radio" name="mobileEditCategoryIcon" value="fa-mobile-alt" ${category.icon === 'fa-mobile-alt' ? 'checked' : ''} hidden>
                                        <i class="fas fa-mobile-alt" style="font-size: 1.2rem; margin-bottom: 0.25rem;"></i>
                                        <span style="font-size: 0.8rem;">Teléfono</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-actions" style="margin-top: 1.5rem;">
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
        
        // Remover modal existente si hay
        const existingModal = document.getElementById('mobileEditCategoryModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Agregar event listener al formulario
        const form = document.getElementById('mobileEditCategoryForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMobileCategoryChanges(category.id);
            });
        }
        
        // Mostrar modal
        const modal = document.getElementById('mobileEditCategoryModal');
        if (modal) modal.classList.remove('hidden');
        
        // Enfocar el input
        setTimeout(() => {
            const nameInput = document.getElementById('mobileEditCategoryName');
            if (nameInput) nameInput.focus();
        }, 300);
    }
    
    saveMobileCategoryChanges(categoryId) {
        const name = document.getElementById('mobileEditCategoryName')?.value.trim();
        const color = document.getElementById('mobileEditCategoryColor')?.value;
        const iconRadio = document.querySelector('input[name="mobileEditCategoryIcon"]:checked');
        const icon = iconRadio ? iconRadio.value : 'fa-tag';
        
        if (!name || !color || !icon) {
            this.salesSystem.showNotification('Por favor completa todos los campos', 'error');
            return;
        }
        
        const updatedCategory = {
            name: name,
            color: color,
            icon: icon
        };
        
        this.salesSystem.updateCategory(categoryId, updatedCategory);
        
        // Cerrar modales
        const modal = document.getElementById('mobileEditCategoryModal');
        if (modal) modal.remove();
        
        const mobileModal = document.getElementById('mobileCategoriesModal');
        if (mobileModal) mobileModal.remove();
    }
    
    closeEditCategoryModal() {
        const modal = document.getElementById('editCategoryModal');
        if (modal) {
            modal.remove();
        }
        
        const mobileModal = document.getElementById('mobileEditCategoryModal');
        if (mobileModal) {
            mobileModal.remove();
        }
    }
    
    saveCategoryChanges(categoryId) {
        const name = document.getElementById('editCategoryName')?.value.trim();
        const color = document.getElementById('editCategoryColor')?.value;
        const icon = document.getElementById('editCategoryIcon')?.value;
        
        if (!name || !color || !icon) {
            this.salesSystem.showNotification('Por favor completa todos los campos', 'error');
            return;
        }
        
        const updatedCategory = {
            name: name,
            color: color,
            icon: icon
        };
        
        this.salesSystem.updateCategory(categoryId, updatedCategory);
        this.closeEditCategoryModal();
        this.closeManageCategoriesModal();
    }
    
    deleteCategory(categoryId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
            const success = this.salesSystem.deleteCategory(categoryId);
            if (success) {
                this.renderCategoriesList();
                
                // Actualizar también la vista móvil si existe
                const mobileModal = document.getElementById('mobileCategoriesModal');
                if (mobileModal) {
                    this.showMobileCategoriesModal();
                }
            }
        }
    }
}
