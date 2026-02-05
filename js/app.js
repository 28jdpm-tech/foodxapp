// ============================================
// FoodX POS PRO - Multiple Client Rows System
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // App State
    const state = {
        currentPage: 'new-order',
        serviceType: null,
        orderTotal: 0,
        categoryData: {},
        rowCounter: 0,
        isAdminAuthenticated: false,
        pendingAdminAction: null,
        appendingOrderId: null,
        selectedPaymentMethod: 'efectivo'
    };

    // Note: Default category creation is now handled in data.js
    // Firebase sync will restore admin config when localStorage is empty

    // Listen for config loaded from cloud (after cache clear)
    window.addEventListener('configLoadedFromCloud', () => {
        console.log('🔄 Config loaded from cloud, refreshing UI...');
        initializeCategories();
        updateOrderTotal();
        lucide.createIcons();
    });

    // Initialize all categories (including those added dynamically or via sync)
    function initializeCategories() {
        const config = StorageManager.getConfig();
        const container = document.getElementById('orderCategories');
        if (!container) return;

        // Save existing category rows to prevent data loss on refresh
        const existingData = state.categoryData || {};

        container.innerHTML = config.categories.map(category => `
            <div class="category-section" data-category="${category.id}">
                <div class="category-header">
                    <div class="category-title">
                        <span class="category-name">${category.name.toUpperCase()}</span>
                        <span class="category-total-price" data-value="0">$0</span>
                    </div>
                    <button class="add-row-btn">
                        <span>CLIENTE</span>
                        <i data-lucide="plus"></i>
                    </button>
                </div>
                <div class="category-rows-container"></div>
            </div>
        `).join('');

        const sections = container.querySelectorAll('.category-section');
        sections.forEach(section => {
            const catId = section.dataset.category;

            // Re-bind state or init new
            if (!state.categoryData[catId]) {
                state.categoryData[catId] = { rows: [] };
            }

            // Bind click event
            const addBtn = section.querySelector('.add-row-btn');
            addBtn.addEventListener('click', () => {
                addNewRow(catId);
            });

            // Restore previous rows if they exist (for live updates)
            if (existingData[catId] && existingData[catId].rows.length > 0) {
                const rowsContainer = section.querySelector('.category-rows-container');
                existingData[catId].rows.forEach(rowData => {
                    const rowEl = createRowElement(catId, rowData.id);
                    rowsContainer.appendChild(rowEl);
                });
                updateCategoryTotal(catId);
            }
        });

        lucide.createIcons();
    }

    initializeCategories();

    // DOM Elements
    const elements = {
        menuBtn: document.getElementById('menuBtn'),
        navDrawer: document.getElementById('navDrawer'),
        drawerOverlay: document.getElementById('drawerOverlay'),
        closeDrawer: document.getElementById('closeDrawer'),
        drawerItems: document.querySelectorAll('.drawer-item'),
        pages: document.querySelectorAll('.page'),
        serviceTabs: document.querySelectorAll('.service-tab'),
        categorySections: document.querySelectorAll('.category-section'),
        totalAmount: document.getElementById('totalAmount'),
        sendToKitchenBtn: document.getElementById('sendToKitchenBtn'),
        orderCustomerName: document.getElementById('orderCustomerName'),
        // Checkout / Payment
        toPrintCount: document.getElementById('toPrintCount'),
        pendingPaymentCount: document.getElementById('pendingPaymentCount'),
        paidOrdersCount: document.getElementById('paidOrdersCount'),
        toPrintList: document.getElementById('toPrintList'),
        pendingPaymentList: document.getElementById('pendingPaymentList'),
        paidOrdersList: document.getElementById('paidOrdersList'),
        paymentModal: document.getElementById('paymentModal'),
        paymentModalOverlay: document.getElementById('paymentModalOverlay'),
        paymentOrderNum: document.getElementById('paymentOrderNum'),
        paymentTicketContent: document.getElementById('paymentTicketContent'),
        paymentTotal: document.getElementById('paymentTotal'),
        printPaymentTicket: document.getElementById('printPaymentTicket'),
        cancelPayment: document.getElementById('cancelPayment'),
        confirmPayment: document.getElementById('confirmPayment'),
        deleteOrderBtn: document.getElementById('deleteOrderBtn'),
        // Ticket Modal
        ticketModal: document.getElementById('ticketModal'),
        ticketContent: document.getElementById('ticketContent'),
        cancelTicket: document.getElementById('cancelTicket'),
        cancelTicketFooter: document.getElementById('cancelTicketFooter'),
        closeTicketModal: document.getElementById('closeTicketModal'),
        printTicket: document.getElementById('printTicket'),
        confirmTicket: document.getElementById('confirmTicket'),
        // Admin
        adminTabs: document.querySelectorAll('.admin-tab'),
        adminPanels: document.querySelectorAll('.admin-panel'),
        adminCategoriesList: document.getElementById('adminCategoriesList'),
        adminCategorySelectFlavors: document.getElementById('adminCategorySelectFlavors'),
        adminCategorySelectExtras: document.getElementById('adminCategorySelectExtras'),
        adminCategorySelectObs: document.getElementById('adminCategorySelectObs'),
        adminFlavorsList: document.getElementById('adminFlavorsList'),
        adminExtrasList: document.getElementById('adminExtrasList'),
        adminObsList: document.getElementById('adminObsList'),
        adminModal: document.getElementById('adminModal'),
        adminModalTitle: document.getElementById('adminModalTitle'),
        adminModalBody: document.getElementById('adminModalBody'),
        cancelAdminModal: document.getElementById('cancelAdminModal'),
        confirmAdminModal: document.getElementById('confirmAdminModal'),
        addCategoryBtn: document.getElementById('addCategoryBtn'),
        addFlavorBtn: document.getElementById('addFlavorBtn'),
        addExtraBtn: document.getElementById('addExtraBtn'),
        addObsBtn: document.getElementById('addObsBtn'),
        // History
        historyTabs: document.querySelectorAll('.history-tab'),
        datePickerContainer: document.getElementById('datePickerContainer'),
        historyDatePicker: document.getElementById('historyDatePicker'),
        searchDateBtn: document.getElementById('searchDateBtn'),
        historyOrdersList: document.getElementById('historyOrdersList'),
        historyOrderModal: document.getElementById('historyOrderModal'),
        historyModalOverlay: document.getElementById('historyModalOverlay'),
        historyOrderDetail: document.getElementById('historyOrderDetail'),
        historyTicketContent: document.getElementById('historyTicketContent'),
        backToHistoryBtn: document.getElementById('backToHistoryBtn'),
        reprintOrderBtn: document.getElementById('reprintOrderBtn'),
        deleteOrderBtnHistory: document.getElementById('deleteOrderBtnHistory'),
        // Reports
        reportDatePicker: document.getElementById('reportDatePicker'),
        reportPeriodSelect: document.getElementById('reportPeriodSelect'),
        reportDatePickerGroup: document.getElementById('reportDatePickerGroup'),
        searchReportBtn: document.getElementById('searchReportBtn'),
        reportDailySales: document.getElementById('reportDailySales'),
        reportFoodSales: document.getElementById('reportFoodSales'),
        reportBebidasSales: document.getElementById('reportBebidasSales'),
        reportDesechablesSales: document.getElementById('reportDesechablesSales'),
        reportEfectivoSales: document.getElementById('reportEfectivoSales'),
        reportNequiSales: document.getElementById('reportNequiSales'),
        reportDaviplataSales: document.getElementById('reportDaviplataSales'),
        // Admin Security
        adminLoginModal: document.getElementById('adminLoginModal'),
        adminPasswordInput: document.getElementById('adminPasswordInput'),
        confirmAdminLogin: document.getElementById('confirmAdminLogin'),
        closeAdminLoginModal: document.getElementById('closeAdminLoginModal'),
        newAdminPassword: document.getElementById('newAdminPassword'),
        confirmAdminPassword: document.getElementById('confirmAdminPassword'),
        saveAdminPasswordBtn: document.getElementById('saveAdminPasswordBtn'),
        // History Summary
        historyTotalSales: document.getElementById('historyTotalSales'),
        historyTotalEfectivo: document.getElementById('historyTotalEfectivo'),
        historyTotalNequi: document.getElementById('historyTotalNequi'),
        historyTotalDaviplata: document.getElementById('historyTotalDaviplata'),
        historyTotalFood: document.getElementById('historyTotalFood'),
        historyTotalBebidas: document.getElementById('historyTotalBebidas'),
        historyTotalDesechables: document.getElementById('historyTotalDesechables'),
        // Detailed Reports
        categorySalesList: document.getElementById('categorySalesList'),
        extrasSalesList: document.getElementById('extrasSalesList'),
        flavorSalesList: document.getElementById('flavorSalesList'),
        sizeSalesList: document.getElementById('sizeSalesList'),
        categoryQtyList: document.getElementById('categoryQtyList'),
        // Report Detail Modal
        reportDetailModal: document.getElementById('reportDetailModal'),
        reportDetailList: document.getElementById('reportDetailList'),
        reportDetailTitle: document.getElementById('reportDetailTitle'),
        closeReportDetailModal: document.getElementById('closeReportDetailModal'),
        closeReportDetailModalOverlay: document.getElementById('closeReportDetailModalOverlay'),
    };

    let currentReportOrders = [];

    // ============================================
    // Navigation Drawer
    // ============================================

    if (elements.menuBtn) {
        elements.menuBtn.addEventListener('click', () => {
            elements.navDrawer.classList.add('open');
        });
    }

    if (elements.closeDrawer) {
        elements.closeDrawer.addEventListener('click', () => {
            elements.navDrawer.classList.remove('open');
        });
    }

    if (elements.drawerOverlay) {
        elements.drawerOverlay.addEventListener('click', () => {
            elements.navDrawer.classList.remove('open');
        });
    }

    elements.drawerItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;

            // Protection for Admin, History, and Reports pages
            const protectedPages = ['admin', 'history', 'reports'];
            if (protectedPages.includes(page) && !state.isAdminAuthenticated) {
                if (elements.adminLoginModal) {
                    elements.adminLoginModal.classList.add('open');
                    elements.adminPasswordInput.value = '';
                    elements.adminPasswordInput.focus();
                    elements.navDrawer.classList.remove('open');
                    // Store the intended page for after login
                    state.pendingAdminPage = page;
                }
                return;
            }

            elements.drawerItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            elements.pages.forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`page-${page}`);
            if (targetPage) targetPage.classList.add('active');

            state.currentPage = page;
            elements.navDrawer.classList.remove('open');

            // Show/Hide footer based on page
            const appFooter = document.getElementById('appFooter');
            if (appFooter) {
                appFooter.style.display = (page === 'new-order') ? 'flex' : 'none';
            }

            if (page === 'kitchen') {
                renderKitchenPage();
            } else if (page === 'checkout') {
                renderCheckoutPage();
            } else if (page === 'orders') {
                renderOrdersPage();
            } else if (page === 'history') {
                renderHistoryPage();
            } else if (page === 'reports') {
                // Initialize report date to today
                if (elements.reportDatePicker && !elements.reportDatePicker.value) {
                    elements.reportDatePicker.value = new Date().toISOString().split('T')[0];
                }
                renderReportsPage();
            } else if (page === 'admin') {
                renderAdminPage();
            } else if (page === 'new-order') {
                state.appendingOrderId = null; // Clear if navigating manually to new order
                initializeCategories();
                refreshOrderPageUI();
            }

            // Remove flag if already redirected
            if (page === 'admin') state.pendingAdminRedirect = false;

            lucide.createIcons();
        });
    });

    function refreshOrderPageUI() {
        const config = StorageManager.getConfig();
        const sections = document.querySelectorAll('.category-section');

        // Refresh Category Headers (Names/Icons)
        sections.forEach(section => {
            const categoryId = section.dataset.category;
            const catInfo = config.categories.find(c => c.id === categoryId);
            if (catInfo) {
                const nameEl = section.querySelector('.category-name');
                if (nameEl) nameEl.textContent = catInfo.name.toUpperCase();
            }

            // Refresh existing rows flavor/drink dropdowns
            const flavors = config.flavors[categoryId] || [];
            const flavorOptions = flavors.map(f => `<option value="${f.id}">${f.name}</option>`).join('');

            section.querySelectorAll('.client-row').forEach(rowEl => {
                const rowId = rowEl.dataset.rowId;
                const rowData = state.categoryData[categoryId].rows.find(r => r.id === rowId);

                rowEl.querySelectorAll('.flavor-select').forEach((select, idx) => {
                    const currentVal = rowData ? rowData.blocks[idx] : select.value;
                    select.innerHTML = `<option value="">Sel.</option>${flavorOptions}`;
                    select.value = currentVal;
                });
            });

            updateCategoryTotal(categoryId);
        });
        updateOrderTotal();
    }

    // ============================================
    // Service Tabs
    // ============================================

    elements.serviceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.serviceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.serviceType = tab.dataset.service;
        });
    });

    // ============================================
    // Create Row Element Function
    // ============================================

    function createRowElement(category, rowId) {
        const rowData = {
            id: rowId,
            qty: 1,
            blocks: ['', '', ''],
            extras: [],
            observations: []
        };

        const config = StorageManager.getConfig();
        state.categoryData[category].rows.push(rowData);

        const rowEl = document.createElement('div');
        rowEl.className = 'client-row';
        rowEl.dataset.rowId = rowId;

        const flavors = config.flavors[category] || [];
        const flavorOptions = flavors.map(f => `<option value="${f.id}">${f.name}</option>`).join('');

        // Use category-specific extras and observations
        const categoryExtras = (config.extras && config.extras[category]) || [];
        const extraOptions = categoryExtras.filter(e => e.active !== false).map(e =>
            `<option value="${e.id}">${e.name}</option>`
        ).join('');

        const categoryObs = (config.observations && config.observations[category]) || [];
        const obsOptions = categoryObs.filter(o => o.active !== false).map(o =>
            `<option value="${o.id}">${o.name}</option>`
        ).join('');

        const isBebida = category === 'bebidas';
        rowEl.innerHTML = `
            <div class="row-fields ${isBebida ? 'bebidas-row' : ''}">
                <div class="field-col flavor-col">
                    <label>${isBebida ? 'BEBIDA' : (category === 'combos' ? 'HB' : 'S1')}</label>
                    <div class="field-content">
                        <select class="flavor-select" data-block="1">
                            <option value="">Sel.</option>
                            ${flavorOptions}
                        </select>
                    </div>
                </div>
                ${!isBebida ? `
                <div class="field-col flavor-col">
                    <label>${category === 'combos' ? 'PE' : 'S2'}</label>
                    <div class="field-content">
                        <select class="flavor-select" data-block="2">
                            <option value="">Sel.</option>
                            ${flavorOptions}
                        </select>
                    </div>
                </div>
                <div class="field-col flavor-col">
                    <label>${category === 'combos' ? 'SA' : 'S3'}</label>
                    <div class="field-content">
                        <select class="flavor-select" data-block="3">
                            <option value="">Sel.</option>
                            ${flavorOptions}
                        </select>
                    </div>
                </div>
                <div class="field-col flavor-col">
                    <label>ADI</label>
                    <div class="field-content">
                        <div class="multi-select-trigger" id="extra-trigger-${rowId}" data-type="extra">
                            <span class="selected-text">Sel.</span>
                        </div>
                    </div>
                </div>
                <div class="field-col flavor-col">
                    <label>OBS</label>
                    <div class="field-content">
                        <div class="multi-select-trigger" id="obs-trigger-${rowId}" data-type="obs">
                            <span class="selected-text">Sel.</span>
                        </div>
                    </div>
                </div>
                ` : ''}
                <div class="field-col action-col">
                    <label>&nbsp;</label>
                    <div class="field-content">
                        <button class="delete-row-btn" title="Eliminar">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        setupRowListeners(rowEl, category, rowId);
        lucide.createIcons();
        return rowEl;
    }

    function setupRowListeners(rowEl, category, rowId) {
        const getRowData = () => state.categoryData[category].rows.find(r => r.id === rowId);

        const deleteBtn = rowEl.querySelector('.delete-row-btn');
        deleteBtn.addEventListener('click', () => {
            const rows = state.categoryData[category].rows;
            const idx = rows.findIndex(r => r.id === rowId);
            if (idx > -1) rows.splice(idx, 1);
            rowEl.remove();
            updateCategoryTotal(category);
            updateOrderTotal();
        });

        rowEl.querySelectorAll('.flavor-select').forEach(select => {
            select.addEventListener('change', () => {
                const data = getRowData();
                if (data) {
                    const blockIndex = parseInt(select.dataset.block) - 1;
                    data.blocks[blockIndex] = select.value;
                    updateCategoryTotal(category);
                    updateOrderTotal();
                }
            });
        });

        // Modal-based Selection Handlers
        const extraTrigger = rowEl.querySelector(`#extra-trigger-${rowId}`);
        if (extraTrigger) {
            extraTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const data = getRowData();
                if (!data) return;
                const config = StorageManager.getConfig();
                const options = (config.extras && config.extras[category]) || [];
                // Use Floating Dropdown
                openFloatingDropdown(extraTrigger, 'Adicionales', options, data.extras, (selectedIds) => {
                    data.extras = selectedIds;
                    const count = data.extras.length;
                    let displayText = 'Sel.';
                    if (count === 1) {
                        const item = options.find(o => o.id === selectedIds[0]);
                        displayText = item ? item.name : 'Sel.';
                    } else if (count > 1) {
                        displayText = count;
                    }
                    extraTrigger.querySelector('.selected-text').textContent = displayText;
                    updateCategoryTotal(category);
                    updateOrderTotal();
                });
            });
        }

        const obsTrigger = rowEl.querySelector(`#obs-trigger-${rowId}`);
        if (obsTrigger) {
            obsTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const data = getRowData();
                if (!data) return;
                const config = StorageManager.getConfig();
                const options = (config.observations && config.observations[category]) || [];
                // Use Floating Dropdown
                openFloatingDropdown(obsTrigger, 'Observaciones', options, data.observations, (selectedIds) => {
                    data.observations = selectedIds;
                    const count = data.observations.length;
                    let displayText = 'Sel.';
                    if (count === 1) {
                        const item = options.find(o => o.id === selectedIds[0]);
                        displayText = item ? item.name : 'Sel.';
                    } else if (count > 1) {
                        displayText = count;
                    }
                    obsTrigger.querySelector('.selected-text').textContent = displayText;
                    updateCategoryTotal(category);
                    updateOrderTotal();
                });
            });
        }
    }

    // ============================================
    // Price Calculations
    // ============================================

    function updateCategoryTotal(category) {
        const config = StorageManager.getConfig();
        const section = document.querySelector(`.category-section[data-category="${category}"]`);
        if (!section) return;
        const priceEl = section.querySelector('.category-total-price');

        let total = 0;
        state.categoryData[category].rows.forEach(data => {
            const rowEl = document.querySelector(`.client-row[data-row-id="${data.id}"]`);
            const filledBlocks = data.blocks.filter(b => b !== '').length;

            let rowPrice = 0;
            let sizeLabel = '--';

            // Calculate extras price regardless of flavor selection
            const categoryExtras = config.extras[category] || [];
            const extraPrice = data.extras.reduce((sum, eId) => {
                const eItem = categoryExtras.find(ex => ex.id === eId);
                return sum + (eItem ? eItem.price : 0);
            }, 0);

            const categoryObs = config.observations[category] || [];
            const obsPrice = data.observations.reduce((sum, oId) => {
                const oItem = categoryObs.find(obs => obs.id === oId);
                return sum + (oItem ? (oItem.price || 0) : 0);
            }, 0);

            if (filledBlocks > 0) {
                if (category === 'bebidas') {
                    const flavorId = data.blocks[0];
                    const flavor = config.flavors[category].find(f => f.id === flavorId);
                    rowPrice = (flavor ? flavor.price : 0) * data.qty;
                    sizeLabel = '';
                } else {
                    const size = calculateSize(filledBlocks, category);
                    sizeLabel = size;
                    const basePrice = config.prices[category][size];

                    if (category === 'salchipapas') {
                        if (data.observations.length > 0) {
                            rowPrice = (obsPrice + extraPrice) * data.qty;
                        } else {
                            rowPrice = (basePrice + extraPrice) * data.qty;
                        }
                    } else {
                        rowPrice = (basePrice + extraPrice + obsPrice) * data.qty;
                    }
                }
            } else if (extraPrice > 0 || obsPrice > 0) {
                // Extras-only order (no flavor selected)
                rowPrice = (extraPrice + obsPrice) * data.qty;
                sizeLabel = 'ADI';
            }

            total += rowPrice;

            if (rowEl) {
                const rowPriceEl = rowEl.querySelector('.row-total-price');
                const rowSizeEl = rowEl.querySelector('.row-size-badge');
                if (rowPriceEl) rowPriceEl.textContent = rowPrice > 0 ? formatPrice(rowPrice) : '$0';
                if (rowSizeEl) {
                    rowSizeEl.textContent = sizeLabel;
                    rowSizeEl.className = `row-size-badge size-${sizeLabel.toLowerCase()}`;
                }
            }
        });

        priceEl.textContent = total > 0 ? formatPrice(total) : '$0';
        priceEl.dataset.value = total;
    }

    function updateOrderTotal() {
        let total = 0;
        document.querySelectorAll('.category-total-price').forEach(el => {
            total += parseInt(el.dataset.value || 0);
        });
        state.orderTotal = total;
        if (elements.totalAmount) elements.totalAmount.textContent = formatPrice(total);
    }

    function addNewRow(category) {
        state.rowCounter++;
        const rowId = `row_${state.rowCounter}`;
        const section = document.querySelector(`.category-section[data-category="${category}"]`);
        if (!section) return;
        const container = section.querySelector('.category-rows-container');
        const rowEl = createRowElement(category, rowId);
        container.appendChild(rowEl);
        lucide.createIcons();
    }

    // Category management removed since it's handled by initializeCategories()
    // No extra code here.

    // ============================================
    // Send to Kitchen
    // ============================================

    let pendingOrder = null;

    if (elements.sendToKitchenBtn) {
        elements.sendToKitchenBtn.addEventListener('click', async () => {
            const config = StorageManager.getConfig();
            const items = [];

            Object.keys(state.categoryData).forEach(category => {
                const categoryInfo = config.categories.find(c => c.id === category);

                state.categoryData[category].rows.forEach(rowData => {
                    const filledBlocks = rowData.blocks.filter(b => b !== '');
                    const hasExtras = rowData.extras && rowData.extras.length > 0;
                    const hasObs = rowData.observations && rowData.observations.length > 0;

                    // Skip if no selections at all
                    if (filledBlocks.length === 0 && !hasExtras && !hasObs) return;

                    const isBebida = category === 'bebidas';
                    let size = '';

                    if (filledBlocks.length > 0) {
                        size = isBebida ? '' : calculateSize(filledBlocks.length, category);
                    } else {
                        size = 'ADI'; // Extras-only
                    }

                    const flavorNames = rowData.blocks.filter(b => b).map(b => {
                        const flavor = config.flavors[category].find(f => f.id === b);
                        return flavor ? flavor.name : '';
                    });

                    const categoryExtras = config.extras[category] || [];
                    // Map IDs to Names
                    const extraNames = rowData.extras.map(eId => {
                        const item = categoryExtras.find(e => e.id === eId);
                        return item ? item.name : '';
                    }).filter(Boolean);

                    const extraPrice = rowData.extras.reduce((sum, eId) => {
                        const item = categoryExtras.find(e => e.id === eId);
                        return sum + (item ? item.price : 0);
                    }, 0);

                    const categoryObs = config.observations[category] || [];
                    const obsNames = rowData.observations.map(oId => {
                        const item = categoryObs.find(o => o.id === oId);
                        return item ? item.name : '';
                    }).filter(Boolean);
                    // Join multiple obs with comma
                    const obsLabel = obsNames.join(', ');

                    const obsPrice = rowData.observations.reduce((sum, oId) => {
                        const item = categoryObs.find(o => o.id === oId);
                        return sum + (item ? (item.price || 0) : 0);
                    }, 0);

                    let basePrice = 0;
                    if (filledBlocks.length > 0) {
                        if (isBebida) {
                            const flavor = config.flavors[category].find(f => f.id === rowData.blocks[0]);
                            basePrice = flavor ? flavor.price : 0;
                        } else {
                            basePrice = config.prices[category][size] || 0;
                        }
                    }

                    let rowPrice = 0;
                    if (filledBlocks.length === 0) {
                        // Extras-only
                        rowPrice = (extraPrice + obsPrice) * rowData.qty;
                    } else if (category === 'salchipapas') {
                        if (rowData.observations.length > 0) {
                            rowPrice = (obsPrice + extraPrice) * rowData.qty;
                        } else {
                            rowPrice = (basePrice + extraPrice) * rowData.qty;
                        }
                    } else {
                        rowPrice = (basePrice + extraPrice + obsPrice) * rowData.qty;
                    }

                    items.push({
                        id: generateId(),
                        category: category,
                        categoryName: categoryInfo.name,
                        categoryIcon: categoryInfo.icon,
                        qty: rowData.qty,
                        size: size,
                        flavors: flavorNames,
                        extras: extraNames,
                        observations: obsLabel,
                        price: rowPrice
                    });
                });
            });

            if (!state.serviceType && !state.appendingOrderId) {
                showNotification('⚠️ Selecciona: Salón, Llevar o Domicilio', 'error');
                return;
            }

            if (items.length === 0) {
                showNotification('Selecciona al menos un producto');
                return;
            }

            // Validate customer name/table number (mandatory)
            const customerCode = elements.orderCustomerName?.value.trim();
            if (!state.appendingOrderId && !customerCode) {
                showNotification('⚠️ Ingresa nombre del cliente o número de mesa', 'error');
                elements.orderCustomerName?.focus();
                return;
            }

            // Direct Process Logic (Bypass Ticket Modal)
            if (state.appendingOrderId) {
                const originalOrder = StorageManager.getOrders().find(o => o.id == state.appendingOrderId);
                if (originalOrder) {
                    const updatedItems = [...originalOrder.items, ...items]; // items here are already newItems
                    const updatedTotalPrice = updatedItems.reduce((sum, item) => sum + item.price, 0);
                    StorageManager.updateOrder(originalOrder.id, {
                        items: updatedItems,
                        totalPrice: updatedTotalPrice
                    });
                    showNotification(`Pedido ${originalOrder.orderNumber} actualizado`);

                    // --- PRINT NEW ITEMS ONLY ---
                    const partialOrder = {
                        orderNumber: `${originalOrder.orderNumber} (ADI)`,
                        sequenceNumber: originalOrder.sequenceNumber,
                        serviceType: state.serviceType, // Use current UI selection (e.g. Llevar)
                        customerInfo: originalOrder.customerInfo,
                        createdAt: new Date().toISOString(),
                        items: items, // Only new items collected from current UI
                        totalPrice: items.reduce((s, i) => s + i.price, 0),
                        isAppending: true,
                        isPartial: true, // Mark as temporary partial order
                        checkoutPrinted: false, // Ensure it shows in 'To Print'
                        paid: false
                    };

                    // Save partial order so it appears in "Imprimir" list
                    StorageManager.addOrder(partialOrder);

                    showNotification("Adición enviada. Imprimir desde Cobros.");
                }
                state.appendingOrderId = null;
            } else {
                const customerCodeUpper = customerCode.toUpperCase();
                const seqNum = await generateOrderNumber(); // Await Firebase counter
                const orderIdentifier = customerCodeUpper || seqNum;

                const newOrder = {
                    orderNumber: orderIdentifier,
                    sequenceNumber: seqNum,
                    serviceType: state.serviceType,
                    customerInfo: customerCodeUpper,
                    items: items,
                    status: 'pending',
                    totalPrice: items.reduce((sum, item) => sum + item.price, 0),
                    createdBy: 'Cajero 1',
                    needsPrint: true,
                    printed: false,
                    checkoutPrinted: false,
                    isAppending: false,
                    createdAt: new Date().toISOString()
                };
                StorageManager.addOrder(newOrder);
                showNotification(`Pedido ${newOrder.orderNumber} enviado a cocina`);
            }

            resetAllCategories();
        });
    }

    function showTicketModal(order) {
        if (!elements.ticketModal) return;
        elements.ticketContent.textContent = generateTicketText(order);
        elements.ticketModal.classList.add('open');
    }

    function closeTicketModal() {
        if (elements.ticketModal) {
            elements.ticketModal.classList.remove('open');
            pendingOrder = null;
        }
    }

    if (elements.cancelTicket) elements.cancelTicket.addEventListener('click', closeTicketModal);
    if (elements.cancelTicketFooter) elements.cancelTicketFooter.addEventListener('click', closeTicketModal);
    if (elements.closeTicketModal) elements.closeTicketModal.addEventListener('click', closeTicketModal);

    if (elements.printTicket) {
        elements.printTicket.addEventListener('click', () => {
            if (pendingOrder) {
                if (pendingOrder.isAppending) {
                    const originalOrder = StorageManager.getOrders().find(o => o.id == pendingOrder.id);
                    if (originalOrder) {
                        const updatedItems = [...originalOrder.items, ...pendingOrder.newItems];
                        const updatedTotalPrice = updatedItems.reduce((sum, item) => sum + item.price, 0);
                        StorageManager.updateOrder(pendingOrder.id, {
                            items: updatedItems,
                            totalPrice: updatedTotalPrice,
                            checkoutPrinted: false
                        });
                    }
                    state.appendingOrderId = null;
                } else {
                    pendingOrder.printed = true;
                    StorageManager.addOrder(pendingOrder);
                }
                window.print();
                showNotification(`Pedido ${pendingOrder.orderNumber} impreso y enviado`);
                closeTicketModal();
                resetAllCategories();
            }
        });
    }

    if (elements.confirmTicket) {
        elements.confirmTicket.addEventListener('click', () => {
            if (pendingOrder) {
                if (pendingOrder.isAppending) {
                    const originalOrder = StorageManager.getOrders().find(o => o.id == pendingOrder.id);
                    if (originalOrder) {
                        const updatedItems = [...originalOrder.items, ...pendingOrder.newItems];
                        const updatedTotalPrice = updatedItems.reduce((sum, item) => sum + item.price, 0);
                        StorageManager.updateOrder(pendingOrder.id, {
                            items: updatedItems,
                            totalPrice: updatedTotalPrice,
                            checkoutPrinted: false
                        });
                    }
                    state.appendingOrderId = null;
                } else {
                    StorageManager.addOrder(pendingOrder);
                }
                showNotification(`Pedido ${pendingOrder.orderNumber} enviado a cocina`);
                closeTicketModal();
                resetAllCategories();
            }
        });
    }

    function resetAllCategories() {
        Object.keys(state.categoryData).forEach(category => {
            state.categoryData[category].rows = [];
            const section = document.querySelector(`.category-section[data-category="${category}"]`);
            if (section) {
                const container = section.querySelector('.category-rows-container');
                container.innerHTML = '';

                // Reset category total to $0
                const priceEl = section.querySelector('.category-total-price');
                if (priceEl) {
                    priceEl.textContent = '$0';
                    priceEl.dataset.value = '0';
                }
            }
        });

        // Reset Service Type
        state.serviceType = 'salon';
        elements.serviceTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.service === 'salon') tab.classList.add('active');
        });

        // Reset order total
        state.orderTotal = 0;
        updateOrderTotal();

        // Clear customer name
        if (elements.orderCustomerName) elements.orderCustomerName.value = '';
    }

    // ============================================
    // Checkout / Payment
    // ============================================

    let checkoutMode = 'to-print';
    let selectedPaymentOrder = null;

    function renderCheckoutPage() {
        const orders = StorageManager.getOrders();

        // Filter logic:
        // to-print: Not paid AND NOT printed for checkout
        // pending: Not paid AND printed for checkout
        // paid: Paid
        const today = new Date().toDateString();
        const toPrint = orders.filter(o => !o.paid && !o.checkoutPrinted);
        const pending = orders.filter(o => !o.paid && o.checkoutPrinted);
        const paid = orders.filter(o => o.paid && new Date(o.createdAt).toDateString() === today);

        if (elements.toPrintCount) elements.toPrintCount.textContent = toPrint.length;
        if (elements.pendingPaymentCount) elements.pendingPaymentCount.textContent = pending.length;
        if (elements.paidOrdersCount) elements.paidOrdersCount.textContent = paid.length;

        if (elements.toPrintList) elements.toPrintList.innerHTML = toPrint.reverse().map(o => createCheckoutCard(o)).join('');
        if (elements.pendingPaymentList) elements.pendingPaymentList.innerHTML = pending.reverse().map(o => createCheckoutCard(o)).join('');
        if (elements.paidOrdersList) elements.paidOrdersList.innerHTML = paid.reverse().map(o => createCheckoutCard(o)).join('');

        // Visibility toggle
        const lists = {
            'to-print': elements.toPrintList,
            'pending': elements.pendingPaymentList,
            'paid': elements.paidOrdersList
        };

        Object.keys(lists).forEach(mode => {
            if (lists[mode]) {
                if (mode === checkoutMode) {
                    lists[mode].classList.remove('hidden');
                } else {
                    lists[mode].classList.add('hidden');
                }
            }
        });

        document.querySelectorAll('.order-list-card[data-order-id]').forEach(card => {
            card.addEventListener('click', () => {
                openPaymentModal(card.dataset.orderId);
            });
        });

        lucide.createIcons();
    }

    // ============================================
    // Kitchen (KDS)
    // ============================================

    function renderKitchenPage() {
        const orders = StorageManager.getActiveOrders();

        const pending = orders.filter(o => o.status === 'pending');
        const preparing = orders.filter(o => o.status === 'preparing');
        const ready = orders.filter(o => o.status === 'ready');

        const updateColumn = (listId, countId, items, action) => {
            const list = document.getElementById(listId);
            const count = document.getElementById(countId);
            if (count) count.textContent = items.length;
            if (list) {
                list.innerHTML = items.map(o => `
                    <div class="kitchen-card">
                        <div class="kitchen-card-header">
                            <span class="kitchen-order-number">${o.orderNumber} ${o.sequenceNumber && o.sequenceNumber !== o.orderNumber ? `(${o.sequenceNumber})` : ''}</span>
                            <span class="kitchen-time">${o.customerInfo}</span>
                        </div>
                        <div class="kitchen-items">
                            ${o.items.map(item => `
                                <div class="k-item">${item.qty}x ${item.categoryName} ${item.size} ${item.flavors.join('/')}</div>
                            `).join('')}
                        </div>
                        <button class="k-action-btn" onclick="window.advanceOrder('${o.id}')">${action}</button>
                    </div>
                `).join('');
            }
        };

        updateColumn('listPending', 'countPending', pending, 'EMPEZAR');
        updateColumn('listPreparing', 'countPreparing', preparing, 'LISTO');
        updateColumn('listReady', 'countReady', ready, 'ENTREGAR');

        lucide.createIcons();
    }

    window.advanceOrder = function (id) {
        const orders = StorageManager.getOrders();
        const order = orders.find(o => o.id === id);
        if (!order) return;

        const nextStatus = {
            'pending': 'preparing',
            'preparing': 'ready',
            'ready': 'delivered'
        };

        const newStatus = nextStatus[order.status];
        if (newStatus) {
            StorageManager.updateOrder(id, { status: newStatus });
            renderKitchenPage();
            showNotification(`Orden ${order.orderNumber} movida a ${newStatus}`);
        }
    };

    function createCheckoutCard(order) {
        const labels = { pending: 'Pendiente', preparing: 'Preparando', ready: 'Listo', delivered: 'Entregado' };
        return `
            <div class="order-list-card ${order.paid ? 'paid' : ''}" data-order-id="${order.id}">
                <div class="order-card-header">
                    <span class="order-number">${order.orderNumber} ${order.sequenceNumber && order.sequenceNumber !== order.orderNumber ? `(${order.sequenceNumber})` : ''}</span>
                    <span class="order-status-badge">${order.paid ? 'Pagado' : labels[order.status]}</span>
                </div>
                <div class="order-customer-info">
                    <span class="order-time">${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span> - ${order.customerInfo}</span>
                </div>
                <div class="order-items-preview">
                    ${order.items.map(item => `
                        <div class="preview-item">
                            <div class="item-main">
                                <span class="preview-qty">${item.qty}</span>
                                <span class="preview-name">${item.categoryName} ${item.size} ${item.extras.length > 0 ? '+ ' + item.extras.join(', ') : ''}</span>
                            </div>
                            <span class="item-price">${formatPrice(item.price / item.qty)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-card-footer">
                    <div style="display: flex; gap: var(--space-sm); align-items: center;">
                        <span class="order-total">${formatPrice(order.totalPrice)}</span>
                        ${!order.paid ? `
                            <button class="btn-append-items" onclick="event.stopPropagation(); window.appendToOrder('${order.id}')" 
                                style="background: var(--accent-primary); color: white; border: none; padding: 4px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <i data-lucide="plus" style="width: 14px; height: 14px;"></i> AÑADIR
                            </button>
                        ` : ''}
                    </div>
                    ${order.paid ? `
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="status-indicator" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 0.75rem; padding: 2px 8px; border-radius: 999px;">
                                ${(order.paymentMethod || 'EFECTIVO').toUpperCase()}
                            </span>
                            <span class="status-indicator paid-chip">PAGADO</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    window.appendToOrder = function (orderId) {
        const order = StorageManager.getOrders().find(o => o.id == orderId);
        if (!order) return;

        state.appendingOrderId = orderId;
        state.serviceType = order.serviceType;

        // Reset UI to "New Order" page
        state.currentPage = 'new-order';
        elements.pages.forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById('page-new-order');
        if (targetPage) targetPage.classList.add('active');

        // Update drawer state
        elements.drawerItems.forEach(i => i.classList.remove('active'));
        const newOrderTab = Array.from(elements.drawerItems).find(i => i.dataset.page === 'new-order');
        if (newOrderTab) newOrderTab.classList.add('active');

        // Initialize/Clear category rows
        resetAllCategories(); // Ensure we start with a clean UI
        initializeCategories();

        state.serviceType = order.serviceType;

        // Update Service Tabs to match order
        elements.serviceTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.service === order.serviceType);
        });

        // Show Footer
        const appFooter = document.getElementById('appFooter');
        if (appFooter) appFooter.style.display = 'flex';

        if (elements.orderCustomerName) {
            elements.orderCustomerName.value = order.orderNumber.replace('#', '');
        }

        showNotification(`Añadiendo productos a la Orden ${order.orderNumber}`);
        lucide.createIcons();
    };

    function openPaymentModal(orderId) {
        const order = StorageManager.getOrders().find(o => o.id == orderId);
        if (!order || !elements.paymentModal) return;

        selectedPaymentOrder = order;
        elements.paymentOrderNum.textContent = order.orderNumber;
        elements.paymentTotal.textContent = formatPrice(order.totalPrice);
        elements.paymentTicketContent.textContent = generateTicketText(order);

        const modalTitle = elements.paymentModal.querySelector('h3');

        // Button visibility logic
        if (order.paid) {
            modalTitle.textContent = 'Pedido Pagado - Detalle';
            elements.confirmPayment.style.display = 'none';
            elements.printPaymentTicket.style.display = 'flex'; // Allow re-print
            if (elements.deleteOrderBtn) elements.deleteOrderBtn.style.display = 'flex';
        } else if (!order.checkoutPrinted) {
            modalTitle.textContent = 'Imprimir Ticket de Cobro';
            elements.confirmPayment.style.display = 'none';
            elements.printPaymentTicket.style.display = 'flex';
            if (elements.deleteOrderBtn) elements.deleteOrderBtn.style.display = 'flex';
        } else {
            modalTitle.textContent = 'Cobrar Pedido';
            elements.confirmPayment.style.display = 'flex';
            elements.printPaymentTicket.style.display = 'flex'; // Allow re-print even if in pending
            if (elements.deleteOrderBtn) elements.deleteOrderBtn.style.display = 'flex';
        }



        // Reset Payment Method Logic (Radio Buttons)
        const radios = document.querySelectorAll('input[name="paymentMethod"]');
        radios.forEach(r => r.checked = false);
        state.selectedPaymentMethod = null; // Clear state just in case, though we read DOM now.

        // Show/Hide method selector based on payment status
        const methodContainer = document.querySelector('.payment-methods-container');
        if (methodContainer) {
            methodContainer.style.display = elements.confirmPayment.style.display === 'none' ? 'none' : 'block';
        }

        lucide.createIcons();
        elements.paymentModal.classList.remove('hidden');
    }



    document.querySelectorAll('.checkout-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.checkout-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            checkoutMode = tab.dataset.tab;
            renderCheckoutPage();
        });
    });

    if (elements.cancelPayment) {
        elements.cancelPayment.addEventListener('click', () => {
            elements.paymentModal.classList.add('hidden');
            selectedPaymentOrder = null;
        });
    }

    if (elements.paymentModalOverlay) {
        elements.paymentModalOverlay.addEventListener('click', () => {
            elements.paymentModal.classList.add('hidden');
            selectedPaymentOrder = null;
        });
    }

    // Floating Dropdown Logic (Mimics native select)
    function openFloatingDropdown(trigger, title, options, currentIds, onUpdate) {
        // Close any existing
        closeFloatingDropdown();

        const rect = trigger.getBoundingClientRect();

        const dropdown = document.createElement('div');
        dropdown.className = 'floating-dropdown';
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 2}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.minWidth = '200px';
        dropdown.style.maxHeight = '300px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.background = 'var(--bg-card)';
        dropdown.style.border = '1px solid var(--border-default)';
        dropdown.style.borderRadius = 'var(--radius-sm)';
        dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        dropdown.style.zIndex = '9999';
        dropdown.style.padding = '4px';
        dropdown.id = 'activeFloatingDropdown';

        // Header for context?
        // Optional: Add a title row
        // const header = document.createElement('div');
        // header.textContent = title; ...

        let tempSelected = [...currentIds];

        options.filter(o => o.active !== false).forEach(opt => {
            const row = document.createElement('div');
            row.className = 'selection-option';
            row.style.padding = '8px';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.cursor = 'pointer';
            row.style.gap = '8px';

            if (tempSelected.includes(opt.id)) {
                row.style.background = 'var(--bg-secondary)';
                row.style.color = 'var(--accent-primary)';
            }

            row.innerHTML = `
                <input type="checkbox" ${tempSelected.includes(opt.id) ? 'checked' : ''} style="pointer-events:none;">
                <span>${opt.name}</span>
            `;

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                const input = row.querySelector('input');
                // Toggle
                const isChecked = !input.checked;
                input.checked = isChecked;

                if (isChecked) {
                    if (!tempSelected.includes(opt.id)) tempSelected.push(opt.id);
                    row.style.background = 'var(--bg-secondary)';
                    row.style.color = 'var(--accent-primary)';
                } else {
                    const idx = tempSelected.indexOf(opt.id);
                    if (idx > -1) tempSelected.splice(idx, 1);
                    row.style.background = 'transparent';
                    row.style.color = 'var(--text-primary)';
                }
                onUpdate(tempSelected);
            });
            dropdown.appendChild(row);
        });

        // Adjust position if offscreen
        document.body.appendChild(dropdown);
        const dropRect = dropdown.getBoundingClientRect();
        if (dropRect.bottom > window.innerHeight) {
            dropdown.style.top = `${rect.top - dropRect.height - 2}px`;
        }
        if (dropRect.right > window.innerWidth) {
            dropdown.style.left = `${window.innerWidth - dropRect.width - 10}px`;
        }

        // Click outside closes
        setTimeout(() => {
            document.addEventListener('click', closeOnOutsideClick);
        }, 0);
    }

    function closeFloatingDropdown() {
        const existing = document.getElementById('activeFloatingDropdown');
        if (existing) existing.remove();
        document.removeEventListener('click', closeOnOutsideClick);
    }

    function closeOnOutsideClick(e) {
        if (!e.target.closest('#activeFloatingDropdown')) {
            closeFloatingDropdown();
        }
    }

    if (elements.confirmPayment) {
        elements.confirmPayment.addEventListener('click', async () => {
            if (selectedPaymentOrder) {
                // Get selected radio
                const selectedRadio = document.querySelector('input[name="paymentMethod"]:checked');

                if (!selectedRadio) {
                    showNotification('⚠️ Selecciona un medio de pago', 'error');
                    return;
                }

                const method = selectedRadio.value;

                // Open cash drawer if printer is connected
                if (window.openCashDrawer) {
                    await window.openCashDrawer();
                }

                StorageManager.updateOrder(selectedPaymentOrder.id, {
                    paid: true,
                    status: 'delivered',
                    paymentMethod: method
                });
                showNotification(`Pedido ${selectedPaymentOrder.orderNumber} pagado`);
                elements.paymentModal.classList.add('hidden');
                renderCheckoutPage();
            }
        });
    }

    // Print button in payment modal
    if (elements.printPaymentTicket) {
        elements.printPaymentTicket.addEventListener('click', () => {
            if (selectedPaymentOrder) {
                // Show Printing Dialog
                window.print();

                if (selectedPaymentOrder.isPartial) {
                    // If it's a partial order (addition), delete it after printing
                    StorageManager.deleteOrder(selectedPaymentOrder.id);
                    showNotification(`Ticket de adición impreso`);
                } else {
                    // Normal order: Set as printed for checkout
                    StorageManager.updateOrder(selectedPaymentOrder.id, { checkoutPrinted: true });
                    showNotification(`Pedido ${selectedPaymentOrder.orderNumber} enviado a cobrar`);
                }

                // Refresh and close
                elements.paymentModal.classList.add('hidden');
                renderCheckoutPage();
            }
        });
    }

    if (elements.deleteOrderBtn) {
        elements.deleteOrderBtn.addEventListener('click', () => {
            if (!selectedPaymentOrder) return;

            const performDelete = async () => {
                if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el pedido ${selectedPaymentOrder.orderNumber}?`)) {
                    await StorageManager.deleteOrder(selectedPaymentOrder.id);
                    showNotification(`Pedido ${selectedPaymentOrder.orderNumber} eliminado`);
                    elements.paymentModal.classList.add('hidden');
                    renderCheckoutPage();
                }
            };

            if (state.isAdminAuthenticated) {
                performDelete();
            } else {
                state.pendingAdminAction = performDelete;
                elements.adminLoginModal.classList.add('open');
                elements.adminPasswordInput.value = '';
                elements.adminPasswordInput.focus();
            }
        });
    }

    // ============================================
    // Orders / Kitchen
    // ============================================

    function renderOrdersPage() {
        const orders = StorageManager.getActiveOrders().reverse();
        const container = document.getElementById('ordersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="clipboard-list"></i>
                    <h3>No hay comandas activas</h3>
                </div>
            `;
        } else {
            container.innerHTML = orders.map(order => createOrderListCard(order)).join('');
        }
        lucide.createIcons();
    }

    function createOrderListCard(order) {
        const labels = { pending: 'Pendiente', preparing: 'Preparando', ready: 'Listo', delivered: 'Entregado' };
        return `
            <div class="order-list-card">
                <div class="order-card-header">
                    <span class="order-number">${order.orderNumber}</span>
                    <span class="order-status-badge">${labels[order.status]}</span>
                </div>
                <div class="order-customer-info"><span>${order.customerInfo}</span></div>
                <div class="order-items-preview">
                    ${order.items.map(item => `
                        <div class="preview-item">
                            <div class="item-main">
                                <span class="preview-qty">${item.qty}</span>
                                <span class="preview-name">${item.categoryName} ${item.size} ${item.extras.length > 0 ? '+ ' + item.extras.join(', ') : ''}</span>
                            </div>
                            <span class="item-price">${formatPrice(item.price / item.qty)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-card-footer">
                    <span class="order-total">${formatPrice(order.totalPrice)}</span>
                </div>
            </div>
        `;
    }

    // ============================================
    // Reports
    // ============================================

    function renderReportsPage() {
        const period = elements.reportPeriodSelect?.value || 'today';
        let orders = [];

        switch (period) {
            case 'today':
                orders = StorageManager.getTodayOrders();
                break;
            case 'date':
                const filterDate = elements.reportDatePicker?.value;
                orders = filterDate ? StorageManager.getOrdersByDate(filterDate) : StorageManager.getTodayOrders();
                break;
            case 'month':
                orders = StorageManager.getCurrentMonthOrders();
                break;
            case 'total':
                orders = StorageManager.getOrders();
                break;
            default:
                orders = StorageManager.getTodayOrders();
        }

        // Filter out partial/temporary orders from reports
        orders = orders.filter(o => !o.isPartial);

        const paidOrders = orders.filter(o => o.paid);

        const totalSales = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        let totalFood = 0;
        let totalBebidas = 0;
        let totalDesechables = 0;
        let totalEfectivo = 0;
        let totalNequi = 0;
        let totalDaviplata = 0;

        const foodCategories = ['hamburguesas', 'perros', 'salchipapas', 'combos'];

        // Metrics Maps
        const categorySales = {};
        const categoryQtyStats = {}; // { cat: { total: 0, sizes: {} } }
        const flavorStats = { food: {}, drinks: {}, disposables: {} };
        const sizeCounts = { 'XS': 0, 'XM': 0, 'XL': 0, 'HB': 0, 'PE': 0, 'SA': 0 };
        const extrasSales = {};

        paidOrders.forEach(order => {
            order.items.forEach(item => {
                const catId = (item.category || '').toLowerCase();
                const catName = (item.categoryName || '').toLowerCase();

                let targetType = 'food';
                if (catId === 'bebidas' || catName.includes('bebida')) {
                    totalBebidas += item.price;
                    targetType = 'drinks';
                } else if (catId === 'desechables' || catName.includes('desechable')) {
                    totalDesechables += item.price;
                    targetType = 'disposables';
                } else if (foodCategories.includes(catId) || foodCategories.some(f => catName.includes(f.substring(0, 4)))) {
                    totalFood += item.price;
                    targetType = 'food';
                }

                // Category Sales breakdown
                const displayCatName = item.categoryName || 'Otros';
                categorySales[displayCatName] = (categorySales[displayCatName] || 0) + item.price;

                // Category Quantity breakdown
                if (!categoryQtyStats[displayCatName]) {
                    categoryQtyStats[displayCatName] = { total: 0, sizes: {} };
                }
                categoryQtyStats[displayCatName].total += item.qty;
                if (item.size) {
                    categoryQtyStats[displayCatName].sizes[item.size] = (categoryQtyStats[displayCatName].sizes[item.size] || 0) + item.qty;
                }

                // Flavor Counts (Popularity)
                (item.flavors || []).forEach(f => {
                    if (f) {
                        flavorStats[targetType][f] = (flavorStats[targetType][f] || 0) + item.qty;
                    }
                });

                // Size Counts
                if (item.size && sizeCounts.hasOwnProperty(item.size)) {
                    sizeCounts[item.size] += item.qty;
                }

                // Extras Sales
                (item.extras || []).forEach(extraName => {
                    if (extraName) extrasSales[extraName] = (extrasSales[extraName] || 0) + item.qty;
                });
            });

            // Payment Method Breakdown
            const method = order.paymentMethod || 'efectivo';
            if (method === 'nequi') totalNequi += order.totalPrice;
            else if (method === 'daviplata') totalDaviplata += order.totalPrice;
            else totalEfectivo += order.totalPrice;
        });

        // Store for details
        currentReportOrders = paidOrders;

        // Update top cards
        if (elements.reportDailySales) elements.reportDailySales.textContent = formatPrice(totalSales);
        if (elements.reportFoodSales) elements.reportFoodSales.textContent = formatPrice(totalFood);
        if (elements.reportBebidasSales) elements.reportBebidasSales.textContent = formatPrice(totalBebidas);
        if (elements.reportDesechablesSales) elements.reportDesechablesSales.textContent = formatPrice(totalDesechables);
        if (elements.reportEfectivoSales) elements.reportEfectivoSales.textContent = formatPrice(totalEfectivo);
        if (elements.reportNequiSales) elements.reportNequiSales.textContent = formatPrice(totalNequi);
        if (elements.reportDaviplataSales) elements.reportDaviplataSales.textContent = formatPrice(totalDaviplata);

        // Re-attach listeners for detailed view
        document.querySelectorAll('.report-clickable').forEach(card => {
            card.addEventListener('click', () => {
                const method = card.getAttribute('data-report-filter');
                if (method) showReportPaymentDetail(method);
            });
        });

        // 1. Render Categories (Sorted by Price)
        if (elements.categorySalesList) {
            const sortedCats = Object.entries(categorySales).sort((a, b) => b[1] - a[1]);
            const maxSales = sortedCats.length > 0 ? sortedCats[0][1] : 1;
            elements.categorySalesList.innerHTML = sortedCats.map(([name, amount]) => {
                const percentage = (amount / maxSales) * 100;
                return `
                    <div class="category-sales-item">
                        <span class="cat-sales-name">${name}</span>
                        <div class="cat-sales-bar-bg"><div class="cat-sales-bar-fill" style="width: ${percentage}%"></div></div>
                        <span class="cat-sales-amount">${formatPrice(amount)}</span>
                    </div>`;
            }).join('') || '<div class="empty-state">Sin ventas</div>';
        }

        // 1.5. Render Category Quantities
        if (elements.categoryQtyList) {
            const sortedCats = Object.entries(categoryQtyStats).sort((a, b) => b[1].total - a[1].total);
            elements.categoryQtyList.innerHTML = sortedCats.map(([name, stat]) => {
                const sizesHtml = Object.entries(stat.sizes)
                    .map(([size, qty]) => `<span class="qty-pill">${size}: ${qty}</span>`)
                    .join(' ');

                return `
                    <div class="category-qty-item">
                        <div class="qty-item-header">
                            <span class="cat-sales-name">${name}</span>
                            <span class="cat-qty-total">${stat.total} ud.</span>
                        </div>
                        <div class="qty-item-details">
                            ${sizesHtml}
                        </div>
                    </div>`;
            }).join('') || '<div class="empty-state">Sin datos</div>';
        }

        // 2. Render Top Flavors (Grouped and Sorted)
        if (elements.flavorSalesList) {
            let flavorsHtml = '';

            const groupConfig = [
                { key: 'food', label: 'Comida', icon: 'utensils' },
                { key: 'drinks', label: 'Bebidas', icon: 'cup-water' },
                { key: 'disposables', label: 'Desechables', icon: 'package' }
            ];

            groupConfig.forEach(group => {
                const entries = Object.entries(flavorStats[group.key]).sort((a, b) => b[1] - a[1]);
                if (entries.length > 0) {
                    flavorsHtml += `<div class="report-sub-section-title">${group.label}</div>`;
                    flavorsHtml += entries.map(([name, count]) => `
                        <div class="stats-row">
                            <span class="stats-label">${name}</span>
                            <span class="stats-value">${count} ud.</span>
                        </div>
                    `).join('');
                }
            });

            elements.flavorSalesList.innerHTML = flavorsHtml || '<div class="empty-state">Sin datos</div>';
        }

        // 3. Render Sizes
        if (elements.sizeSalesList) {
            const sizesToShow = ['XS', 'XM', 'XL'];
            if (sizeCounts['HB'] > 0 || sizeCounts['PE'] > 0 || sizeCounts['SA'] > 0) {
                sizesToShow.push('HB', 'PE', 'SA');
            }
            elements.sizeSalesList.innerHTML = sizesToShow.map(size => `
                <div class="size-stat-box">
                    <span class="size-name">${size}</span>
                    <span class="size-count">${sizeCounts[size] || 0}</span>
                </div>
            `).join('');
        }

        // 4. Render Extras (Sorted by Popularity/Count)
        if (elements.extrasSalesList) {
            const sortedExtras = Object.entries(extrasSales).sort((a, b) => b[1] - a[1]);
            const maxExtras = sortedExtras.length > 0 ? sortedExtras[0][1] : 1;
            elements.extrasSalesList.innerHTML = sortedExtras.map(([name, count]) => {
                const percentage = (count / maxExtras) * 100;
                return `
                    <div class="category-sales-item">
                        <span class="cat-sales-name">${name}</span>
                        <div class="cat-sales-bar-bg"><div class="cat-sales-bar-fill" style="background: var(--accent-gold); width: ${percentage}%"></div></div>
                        <span class="cat-sales-amount">${count} ud.</span>
                    </div>`;
            }).join('') || '<div class="empty-state">Sin adicionales</div>';
        }

        lucide.createIcons();
    }

    if (elements.searchReportBtn) {
        elements.searchReportBtn.addEventListener('click', () => {
            renderReportsPage();
        });
    }

    function showReportPaymentDetail(method) {
        if (!elements.reportDetailModal || !elements.reportDetailList) return;

        const filtered = currentReportOrders.filter(o => {
            const m = o.paymentMethod || 'efectivo';
            return m === method;
        });

        elements.reportDetailTitle.textContent = `Detalle: ${method.toUpperCase()}`;

        let html = `
            <table class="report-detail-table">
                <thead>
                    <tr>
                        <th>Fecha/Hora</th>
                        <th>Comanda</th>
                        <th>Cliente</th>
                        <th style="text-align: right;">Monto</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (filtered.length === 0) {
            html += `<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay transacciones registradas</td></tr>`;
        } else {
            filtered.forEach(o => {
                const dateObj = new Date(o.createdAt);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

                html += `
                    <tr>
                        <td>
                            <div class="detail-date">${dateStr}</div>
                            <div style="font-size: 0.7rem; color: var(--text-muted);">${timeStr}</div>
                        </td>
                        <td class="detail-order-num">${o.orderNumber}</td>
                        <td style="font-size: 0.8rem; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${o.customerInfo}
                        </td>
                        <td class="detail-amount">${formatPrice(o.totalPrice)}</td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        elements.reportDetailList.innerHTML = html;
        elements.reportDetailModal.classList.add('open');
        lucide.createIcons();
    }

    // Modal close handlers for report detail
    if (elements.closeReportDetailModal) {
        elements.closeReportDetailModal.addEventListener('click', () => {
            elements.reportDetailModal.classList.remove('open');
        });
    }
    if (elements.closeReportDetailModalOverlay) {
        elements.closeReportDetailModalOverlay.addEventListener('click', () => {
            elements.reportDetailModal.classList.remove('open');
        });
    }

    if (elements.reportPeriodSelect) {
        elements.reportPeriodSelect.addEventListener('change', (e) => {
            if (e.target.value === 'date') {
                elements.reportDatePickerGroup.classList.remove('hidden');
            } else {
                elements.reportDatePickerGroup.classList.add('hidden');
                renderReportsPage(); // Auto-refresh for month/total
            }
        });
    }

    // ============================================
    // History
    // ============================================

    let historyMode = 'today';
    let historyFilter = 'all';

    function renderHistoryPage() {
        const ordersRaw = historyMode === 'today'
            ? StorageManager.getTodayOrders().reverse()
            : StorageManager.getOrdersByDate(elements.historyDatePicker.value).reverse();

        // Filter out partial orders from history and show only PAID
        let orders = ordersRaw.filter(o => !o.isPartial && o.paid);

        // Apply Payment Method or Category Filter
        if (historyFilter !== 'all') {
            if (['efectivo', 'nequi', 'daviplata'].includes(historyFilter)) {
                orders = orders.filter(o => (o.paymentMethod || 'efectivo') === historyFilter);
            } else if (['comida', 'bebidas', 'desechables'].includes(historyFilter)) {
                const foodCategories = ['hamburguesas', 'perros', 'salchipapas', 'combos'];
                orders = orders.filter(o => {
                    return o.items.some(item => {
                        const catId = (item.category || '').toLowerCase();
                        if (historyFilter === 'comida') return foodCategories.includes(catId);
                        if (historyFilter === 'bebidas') return catId === 'bebidas';
                        if (historyFilter === 'desechables') return catId === 'desechables';
                        return false;
                    });
                });
            }
        }

        renderHistoryOrdersList(orders);
        calculateHistorySummary(ordersRaw.filter(o => !o.isPartial && o.paid)); // Total summary always shows all

        // Ensure modal is hidden
        if (elements.historyOrderModal) {
            elements.historyOrderModal.classList.add('hidden');
            elements.historyOrderModal.style.display = 'none';
        }
        elements.historyOrdersList.classList.remove('hidden');

        // Show/Hide date picker container
        if (historyMode === 'date') {
            elements.datePickerContainer.classList.remove('hidden');
        } else {
            elements.datePickerContainer.classList.add('hidden');
        }
    }

    // Initialize Clickable Filter Cards in Summary
    document.querySelectorAll('.filter-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            historyFilter = card.dataset.filter;
            renderHistoryPage();
        });
    });

    elements.historyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.historyTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            historyMode = tab.dataset.tab;
            renderHistoryPage();
        });
    });

    if (elements.searchDateBtn) {
        elements.searchDateBtn.addEventListener('click', () => {
            if (!elements.historyDatePicker.value) {
                showNotification('Selecciona una fecha');
                return;
            }
            renderHistoryPage();
        });
    }

    if (elements.historyDatePicker) {
        // Set default to today
        const today = new Date().toISOString().split('T')[0];
        elements.historyDatePicker.value = today;

        // Auto-search on change
        elements.historyDatePicker.addEventListener('change', () => {
            if (historyMode === 'date') {
                renderHistoryPage();
            }
        });
    }

    if (elements.backToHistoryBtn) {
        elements.backToHistoryBtn.addEventListener('click', () => {
            elements.historyOrderModal.classList.add('hidden');
            elements.historyOrderModal.style.display = 'none';
        });
    }

    if (elements.historyModalOverlay) {
        elements.historyModalOverlay.addEventListener('click', () => {
            elements.historyOrderModal.classList.add('hidden');
            elements.historyOrderModal.style.display = 'none';
        });
    }

    let selectedHistoryOrder = null;

    function showOrderDetail(orderId) {
        const order = StorageManager.getOrders().find(o => o.id == orderId);
        if (!order) return;

        selectedHistoryOrder = order;
        elements.historyTicketContent.textContent = generateTicketText(order);

        elements.historyOrderModal.classList.remove('hidden');
        elements.historyOrderModal.style.display = 'flex';
    }

    if (elements.reprintOrderBtn) {
        elements.reprintOrderBtn.addEventListener('click', () => {
            if (selectedHistoryOrder) {
                // In a real app, this would send to a printer
                // For now we use browser print
                showTicketModal(selectedHistoryOrder);
                window.print();
            }
        });
    }

    if (elements.deleteOrderBtnHistory) {
        elements.deleteOrderBtnHistory.addEventListener('click', () => {
            if (!selectedHistoryOrder) return;

            const performDelete = async () => {
                if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el pedido ${selectedHistoryOrder.orderNumber}?`)) {
                    await StorageManager.deleteOrder(selectedHistoryOrder.id);
                    showNotification(`Pedido ${selectedHistoryOrder.orderNumber} eliminado`);
                    elements.historyOrderModal.classList.add('hidden');
                    renderHistoryPage();
                }
            };

            if (state.isAdminAuthenticated) {
                performDelete();
            } else {
                state.pendingAdminAction = performDelete;
                elements.adminLoginModal.classList.add('open');
                elements.adminPasswordInput.value = '';
                elements.adminPasswordInput.focus();
            }
        });
    }

    function renderHistoryOrdersList(orders) {
        const container = document.getElementById('historyOrdersList');
        if (!container) return;
        const labels = { pending: 'Pendiente', preparing: 'Preparando', ready: 'Listo', delivered: 'Entregado' };

        container.innerHTML = orders.map(order => `
            <div class="order-list-card history-order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <span class="order-number">${order.orderNumber}</span>
                    <span class="order-status-badge">${order.paid ? 'Pagado' : labels[order.status]}</span>
                </div>
                <div class="order-customer-info">
                    <span class="order-time">${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span> - ${order.customerInfo}</span>
                </div>
                <div class="order-items-preview">
                    ${order.items.map(item => `
                        <div class="preview-item">
                            <div class="item-main">
                                <span class="preview-qty">${item.qty}</span>
                                <span class="preview-name">${item.categoryName} ${item.size} ${item.extras.length > 0 ? '+ ' + item.extras.join(', ') : ''}</span>
                            </div>
                            <span class="item-price">${formatPrice(item.price / item.qty)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-card-footer">
                    <div class="footer-left">
                        <span class="order-total">${formatPrice(order.totalPrice)}</span>
                        <span class="payment-method-tag">${(order.paymentMethod || 'efectivo').toUpperCase()}</span>
                    </div>
                    ${order.paid ? '<span class="status-indicator paid-chip">PAGADO</span>' : ''}
                </div>
            </div>
        `).join('');

        // Re-attach click listeners for history detail
        document.querySelectorAll('.history-order-card').forEach(card => {
            card.addEventListener('click', () => {
                showOrderDetail(card.dataset.orderId);
            });
        });
    }

    function calculateHistorySummary(orders) {
        const paidOrders = orders.filter(o => o.paid);
        let totalSales = 0;
        let totalEfectivo = 0;
        let totalNequi = 0;
        let totalDaviplata = 0;
        let totalFood = 0;
        let totalBebidas = 0;
        let totalDesechables = 0;

        const foodCategories = ['hamburguesas', 'perros', 'salchipapas', 'combos'];

        paidOrders.forEach(order => {
            totalSales += order.totalPrice;
            const method = order.paymentMethod || 'efectivo';

            if (method === 'nequi') totalNequi += order.totalPrice;
            else if (method === 'daviplata') totalDaviplata += order.totalPrice;
            else totalEfectivo += order.totalPrice;

            // Category Breakdown
            order.items.forEach(item => {
                const catId = (item.category || '').toLowerCase();
                const catName = (item.categoryName || '').toLowerCase();

                if (catId === 'bebidas' || catName.includes('bebida')) {
                    totalBebidas += item.price;
                } else if (catId === 'desechables' || catName.includes('desechable')) {
                    totalDesechables += item.price;
                } else if (foodCategories.includes(catId) || foodCategories.some(f => catName.includes(f.substring(0, 4)))) {
                    totalFood += item.price;
                }
            });
        });

        if (elements.historyTotalSales) elements.historyTotalSales.textContent = formatPrice(totalSales);
        if (elements.historyTotalEfectivo) elements.historyTotalEfectivo.textContent = formatPrice(totalEfectivo);
        if (elements.historyTotalNequi) elements.historyTotalNequi.textContent = formatPrice(totalNequi);
        if (elements.historyTotalDaviplata) elements.historyTotalDaviplata.textContent = formatPrice(totalDaviplata);
        if (elements.historyTotalFood) elements.historyTotalFood.textContent = formatPrice(totalFood);
        if (elements.historyTotalBebidas) elements.historyTotalBebidas.textContent = formatPrice(totalBebidas);
        if (elements.historyTotalDesechables) elements.historyTotalDesechables.textContent = formatPrice(totalDesechables);
    }

    function generateTicketText(order) {
        if (!order || !order.items) return 'Error: Pedido sin productos';
        const TICKET_WIDTH = 24;
        const labels = { salon: 'SALÓN', llevar: 'LLEVAR', domicilio: 'DOMICILIO' };
        const now = new Date(order.createdAt || Date.now());
        const dateStr = now.toLocaleDateString('es-CO');
        const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        const center = (str) => {
            str = String(str).toUpperCase();
            if (str.length >= TICKET_WIDTH) return str.substring(0, TICKET_WIDTH);
            const left = Math.floor((TICKET_WIDTH - str.length) / 2);
            return ' '.repeat(left) + str;
        };

        const justify = (leftStr, rightStr) => {
            const left = String(leftStr).toUpperCase();
            const right = String(rightStr).toUpperCase();
            const spaceNeeded = TICKET_WIDTH - (left.length + right.length);
            if (spaceNeeded < 1) return left + ' ' + right;
            return left + ' '.repeat(spaceNeeded) + right;
        };

        const twoColumns = (leftStr, rightStr) => {
            const COL1_WIDTH = 15;
            const COL2_WIDTH = 6;
            let left = String(leftStr).toUpperCase();
            let right = String(rightStr).toUpperCase();

            if (left.length > COL1_WIDTH) left = left.substring(0, COL1_WIDTH);
            if (right.length > COL2_WIDTH) right = right.substring(0, COL2_WIDTH);

            return left.padEnd(COL1_WIDTH) + ' ' + right.padEnd(COL2_WIDTH) + '  ';
        };

        const L_TOP = "┌───────────────────────┐";
        const L_MID = "├───────────────┬───────┤";
        const L_BOT = "└───────────────┴───────┘";

        const tableHeader = (catName, qty) => {
            const title = `${catName} (${qty})`.toUpperCase();
            // Simple Text Header without grid, but with columns
            let h = title + "\n";
            h += " PRODUCTO        ADICION\n";
            return h;
        };

        const tableRow = (s1, s2, s3, adi) => {
            const flavorsList = [s1, s2, s3].filter(f => f && f.trim() !== '');
            const flavors = flavorsList.join('-');

            // PRODUCTO column: 15 chars, ADICION column: 7 chars
            // We use spaces to align with the boxed header above
            const fCol = flavors.substring(0, 15).toUpperCase().padEnd(15);
            const adCol = (adi || '').substring(0, 7).toUpperCase().padEnd(7);

            // Return plain text row aligned with the grid
            return ` ${fCol} ${adCol}`;
        };

        const topDivider = '━'.repeat(TICKET_WIDTH);
        const subDivider = '─'.repeat(TICKET_WIDTH);

        let ticket = '';
        ticket += topDivider + '\n';
        if (order.isAppending) {
            // Show service type prominently for additions (e.g. LLEVAR)
            const sType = labels[order.serviceType] || 'SALÓN';
            ticket += center(`*** ${sType} ***`) + '\n';
            ticket += center('(ADICION)') + '\n';
        } else {
            ticket += center('FOODX POS PRO') + '\n';
        }

        // Show Name/Code and Sequence Number
        ticket += center(`ID: ${order.orderNumber || '1024'}`) + '\n';
        if (order.sequenceNumber) {
            ticket += center(`ORDEN: ${order.sequenceNumber}`) + '\n';
        }

        ticket += topDivider + '\n';

        // Date and Time on same line, no labels
        ticket += justify(dateStr, timeStr) + '\n';
        ticket += center(`TIPO: ${labels[order.serviceType]}`) + '\n';
        ticket += center(subDivider) + '\n';

        // Group items by category
        const itemsByCategory = {};
        order.items.forEach(item => {
            if (!itemsByCategory[item.category]) {
                itemsByCategory[item.category] = {
                    name: item.categoryName,
                    items: []
                };
            }
            itemsByCategory[item.category].items.push(item);
        });

        Object.keys(itemsByCategory).forEach(catId => {
            const cat = itemsByCategory[catId];
            const catTotalQty = cat.items.reduce((sum, item) => sum + item.qty, 0);

            // Table Header with category integrated - separated
            ticket += '\n' + tableHeader(cat.name, catTotalQty) + '\n';

            cat.items.forEach((item) => {
                const s1 = item.flavors[0] || '';
                const s2 = item.flavors[1] || '';
                const s3 = item.flavors[2] || '';

                // Join multiple extras with hyphen
                const extrasLabel = (item.extras || []).join('-');

                // Table row with Adicion column
                ticket += tableRow(s1, s2, s3, extrasLabel) + '\n';

                if (item.observations && item.observations.trim() !== '') {
                    ticket += ' * OBS: ' + item.observations.toUpperCase() + '\n';
                }
            });
            // Removed L_BOT since header closes itself now
        });

        ticket += '\n' + justify('TOTAL:', formatPrice(order.totalPrice)) + '\n';
        ticket += topDivider + '\n';
        ticket += center('GRACIAS POR SU COMPRA') + '\n';
        ticket += topDivider + '\n\n\n.';

        return ticket;
    }

    // ============================================
    // Administration Logic
    // ============================================

    let currentAdminTab = 'categories';
    let adminEditContext = null;

    function renderAdminPage() {
        renderAdminPanel(currentAdminTab);
    }

    function renderAdminPanel(tab) {
        const config = StorageManager.getConfig();
        const categories = config.categories;

        if (tab === 'categories') renderCategoriesList(categories);
        else if (tab === 'flavors') {
            populateAdminCategorySelect(elements.adminCategorySelectFlavors, categories);
            renderFlavorsList(config.flavors, elements.adminCategorySelectFlavors.value);
        } else if (tab === 'extras') {
            populateAdminCategorySelect(elements.adminCategorySelectExtras, categories);
            renderExtrasList(config.extras, elements.adminCategorySelectExtras.value);
        } else if (tab === 'observations') {
            populateAdminCategorySelect(elements.adminCategorySelectObs, categories);
            renderObsList(config.observations, elements.adminCategorySelectObs.value);
        }
    }

    elements.adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.adminTabs.forEach(t => t.classList.remove('active'));
            elements.adminPanels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            currentAdminTab = tab.dataset.tab;
            const target = document.getElementById(`panel-${currentAdminTab}`);
            if (target) target.classList.add('active');
            renderAdminPage();
        });
    });

    function renderCategoriesList(categories) {
        if (!elements.adminCategoriesList) return;
        elements.adminCategoriesList.innerHTML = categories.map(cat => `
            <div class="admin-item">
                <div class="admin-item-info"><span>${cat.icon} ${cat.name}</span></div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="window.editAdminItem('category', '${cat.id}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="window.deleteAdminItem('category', '${cat.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    function populateAdminCategorySelect(selectEl, categories) {
        if (!selectEl) return;
        const current = selectEl.value;
        selectEl.innerHTML = categories.map(cat => `<option value="${cat.id}" ${cat.id === current ? 'selected' : ''}>${cat.name}</option>`).join('');
    }

    if (elements.adminCategorySelectFlavors) {
        elements.adminCategorySelectFlavors.addEventListener('change', () => {
            renderFlavorsList(StorageManager.getConfig().flavors, elements.adminCategorySelectFlavors.value);
        });
    }

    if (elements.adminCategorySelectExtras) {
        elements.adminCategorySelectExtras.addEventListener('change', () => {
            renderExtrasList(StorageManager.getConfig().extras, elements.adminCategorySelectExtras.value);
        });
    }

    if (elements.adminCategorySelectObs) {
        elements.adminCategorySelectObs.addEventListener('change', () => {
            renderObsList(StorageManager.getConfig().observations, elements.adminCategorySelectObs.value);
        });
    }

    function renderFlavorsList(all, catId) {
        if (!elements.adminFlavorsList) return;
        const list = all[catId] || [];
        const isBebida = catId === 'bebidas';
        elements.adminFlavorsList.innerHTML = list.map(f => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <span>${f.name}</span>
                    ${isBebida ? `<span>${formatPrice(f.price || 0)}</span>` : ''}
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="window.editAdminItem('flavor', '${f.id}', '${catId}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="window.deleteAdminItem('flavor', '${f.id}', '${catId}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    function renderExtrasList(all, catId) {
        if (!elements.adminExtrasList) return;
        const list = all[catId] || [];
        elements.adminExtrasList.innerHTML = list.map(e => `
            <div class="admin-item">
                <div class="admin-item-info"><span>${e.name}</span><span>${formatPrice(e.price)}</span></div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="window.editAdminItem('extra', '${e.id}', '${catId}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="window.deleteAdminItem('extra', '${e.id}', '${catId}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    function renderObsList(all, catId) {
        if (!elements.adminObsList) return;
        const list = all[catId] || [];
        elements.adminObsList.innerHTML = list.map(o => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <span>${o.name}</span>
                    <span>${formatPrice(o.price || 0)}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="window.editAdminItem('observation', '${o.id}', '${catId}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="window.deleteAdminItem('observation', '${o.id}', '${catId}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    window.editAdminItem = function (type, id, parentId = null) {
        console.log('Editing:', type, id, parentId);
        adminEditContext = { type, id, parentId };
        const config = StorageManager.getConfig();
        elements.adminModalTitle.textContent = `Editar ${type}`;
        let html = '';
        if (type === 'category') {
            const item = config.categories.find(c => c.id === id);
            const isCombos = id === 'combos';
            const L1 = isCombos ? 'HB' : 'XS';
            const L2 = isCombos ? 'PE' : 'XM';
            const L3 = isCombos ? 'SA' : 'XL';

            html = `<div class="form-group"><label>Nombre</label><input type="text" id="editName" value="${item.name}"></div>
                    <div class="form-group"><label>Icono</label><input type="text" id="editIcon" value="${item.icon}"></div>
                    <div class="form-row">
                        <div class="form-group"><label>${L1}</label><input type="number" id="priceXS" value="${config.prices[id][L1] || 0}"></div>
                        <div class="form-group"><label>${L2}</label><input type="number" id="priceXM" value="${config.prices[id][L2] || 0}"></div>
                    </div>
                    <div class="form-group"><label>${L3}</label><input type="number" id="priceXL" value="${config.prices[id][L3] || 0}"></div>`;
        } else if (type === 'flavor') {
            const item = config.flavors[parentId].find(f => f.id === id);
            const isBebida = parentId === 'bebidas';
            html = `<div class="form-group"><label>Nombre</label><input type="text" id="editName" value="${item.name}"></div>
                    ${isBebida ? `<div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="${item.price || 0}"></div>` : ''}`;
        } else if (type === 'extra') {
            const item = config.extras[parentId].find(e => e.id === id);
            html = `<div class="form-group"><label>Nombre</label><input type="text" id="editName" value="${item.name}"></div>
                    <div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="${item.price}"></div>`;
        } else if (type === 'observation') {
            const item = config.observations[parentId].find(o => o.id === id);
            html = `<div class="form-group"><label>Descripción</label><input type="text" id="editName" value="${item.name}"></div>
                    <div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="${item.price || 0}"></div>`;
        }
        elements.adminModalBody.innerHTML = html;
        elements.adminModal.classList.add('open');
    };

    window.deleteAdminItem = function (type, id, pId) {
        console.log('Deleting:', type, id, pId);
        if (!confirm('¿Seguro que desea eliminar?')) return;
        const config = StorageManager.getConfig();
        if (type === 'category') {
            config.categories = config.categories.filter(c => c.id !== id);
            delete config.prices[id];
            delete config.flavors[id];
            if (config.extras) delete config.extras[id];
            if (config.observations) delete config.observations[id];
        } else if (type === 'flavor') config.flavors[pId] = config.flavors[pId].filter(f => f.id !== id);
        else if (type === 'extra') config.extras[pId] = config.extras[pId].filter(e => e.id !== id);
        else if (type === 'observation') config.observations[pId] = config.observations[pId].filter(o => o.id !== id);

        StorageManager.saveConfig(config);
        renderAdminPage();
        showNotification('Eliminado correctamente');
    };

    if (elements.cancelAdminModal) elements.cancelAdminModal.onclick = () => elements.adminModal.classList.remove('open');
    if (elements.confirmAdminModal) {
        elements.confirmAdminModal.onclick = () => {
            const config = StorageManager.getConfig();
            const { type, id, parentId } = adminEditContext;
            const name = document.getElementById('editName').value;
            if (type === 'category') {
                const cat = id ? config.categories.find(c => c.id === id) : { id: 'cat_' + Date.now() };
                cat.name = name;
                cat.icon = document.getElementById('editIcon').value;
                if (!id) {
                    config.categories.push(cat);
                    config.flavors[cat.id] = [];
                    if (!config.extras) config.extras = {};
                    if (!config.observations) config.observations = {};
                    config.extras[cat.id] = [];
                    config.observations[cat.id] = [];
                }

                const isCombos = cat.id === 'combos';
                const p1 = +document.getElementById('priceXS').value;
                const p2 = +document.getElementById('priceXM').value;
                const p3 = +document.getElementById('priceXL').value;

                if (isCombos) {
                    config.prices[cat.id] = { HB: p1, PE: p2, SA: p3 };
                } else {
                    config.prices[cat.id] = { XS: p1, XM: p2, XL: p3 };
                }
            } else if (type === 'flavor') {
                const f = id ? config.flavors[parentId].find(x => x.id === id) : { id: 'f_' + Date.now() };
                f.name = name;
                if (parentId === 'bebidas') f.price = +document.getElementById('editPrice').value;
                if (!id) config.flavors[parentId].push(f);
            } else if (type === 'extra') {
                if (!config.extras) config.extras = {};
                if (!config.extras[parentId]) config.extras[parentId] = [];
                const e = id ? config.extras[parentId].find(x => x.id === id) : { id: 'e_' + Date.now() };
                e.name = name;
                e.price = +document.getElementById('editPrice').value;
                if (!id) config.extras[parentId].push(e);
            } else if (type === 'observation') {
                if (!config.observations[parentId]) config.observations[parentId] = [];
                const o = id ? config.observations[parentId].find(x => x.id === id) : { id: 'o_' + Date.now() };
                o.name = name;
                o.price = +document.getElementById('editPrice').value;
                if (!id) config.observations[parentId].push(o);
            }
            StorageManager.saveConfig(config);
            elements.adminModal.classList.remove('open');
            renderAdminPage();
            showNotification('Guardado correctamente');
        };
    }

    if (elements.addCategoryBtn) {
        elements.addCategoryBtn.onclick = () => {
            adminEditContext = { type: 'category', id: null };
            elements.adminModalTitle.textContent = 'Nueva Categoría';
            elements.adminModalBody.innerHTML = `
                <div class="form-group"><label>Nombre</label><input type="text" id="editName"></div>
                <div class="form-group"><label>Icono</label><input type="text" id="editIcon"></div>
                <div class="form-row">
                    <div class="form-group"><label>XS / HB</label><input type="number" id="priceXS" value="0"></div>
                    <div class="form-group"><label>XM / PE</label><input type="number" id="priceXM" value="0"></div>
                </div>
                <div class="form-group"><label>XL / SA</label><input type="number" id="priceXL" value="0"></div>`;
            elements.adminModal.classList.add('open');
        };
    }

    if (elements.addFlavorBtn) {
        elements.addFlavorBtn.onclick = () => {
            const catId = elements.adminCategorySelectFlavors.value;
            const isBebida = catId === 'bebidas';
            adminEditContext = { type: 'flavor', id: null, parentId: catId };
            elements.adminModalTitle.textContent = 'Nuevo Sabor / Bebida';
            elements.adminModalBody.innerHTML = `
                <div class="form-group"><label>Nombre</label><input type="text" id="editName"></div>
                ${isBebida ? `<div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="0"></div>` : ''}
            `;
            elements.adminModal.classList.add('open');
        };
    }

    if (elements.addExtraBtn) {
        elements.addExtraBtn.onclick = () => {
            const catId = elements.adminCategorySelectExtras.value;
            adminEditContext = { type: 'extra', id: null, parentId: catId };
            elements.adminModalTitle.textContent = 'Nuevo Adicional';
            elements.adminModalBody.innerHTML = `<div class="form-group"><label>Nombre</label><input type="text" id="editName"></div>
                <div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="0"></div>`;
            elements.adminModal.classList.add('open');
        };
    }

    if (elements.addObsBtn) {
        elements.addObsBtn.onclick = () => {
            const catId = elements.adminCategorySelectObs.value;
            adminEditContext = { type: 'observation', id: null, parentId: catId };
            elements.adminModalTitle.textContent = 'Nueva Observación';
            elements.adminModalBody.innerHTML = `
                <div class="form-group"><label>Nombre</label><input type="text" id="editName"></div>
                <div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="0"></div>
            `;
            elements.adminModal.classList.add('open');
        };
    }

    // ============================================
    // Security / Password Logic
    // ============================================

    if (elements.confirmAdminLogin) {
        const handleLogin = () => {
            const config = StorageManager.getConfig();
            const input = elements.adminPasswordInput.value;

            if (input === config.adminPassword) {
                state.isAdminAuthenticated = true;
                elements.adminLoginModal.classList.remove('open');
                showNotification('Acceso concedido');

                // Trigger the pending action (like deletion)
                if (state.pendingAdminAction) {
                    state.pendingAdminAction();
                    state.pendingAdminAction = null;
                }

                // Trigger the pending navigation to protected page
                if (state.pendingAdminPage) {
                    const targetBtn = Array.from(elements.drawerItems).find(i => i.dataset.page === state.pendingAdminPage);
                    if (targetBtn) targetBtn.click();
                    state.pendingAdminPage = null;
                }
            } else {
                showNotification('Contraseña incorrecta', 'error');
                elements.adminPasswordInput.value = '';
                elements.adminPasswordInput.focus();
            }
        };

        elements.confirmAdminLogin.addEventListener('click', handleLogin);
        elements.adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    if (elements.closeAdminLoginModal) {
        elements.closeAdminLoginModal.addEventListener('click', () => {
            elements.adminLoginModal.classList.remove('open');
            state.pendingAdminPage = null;
            state.pendingAdminAction = null;
        });
    }

    if (elements.saveAdminPasswordBtn) {
        elements.saveAdminPasswordBtn.addEventListener('click', () => {
            const newPass = elements.newAdminPassword.value;
            const confirmPass = elements.confirmAdminPassword.value;

            if (newPass.length < 4) {
                showNotification('La contraseña debe tener al menos 4 caracteres', 'error');
                return;
            }

            if (newPass !== confirmPass) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            const config = StorageManager.getConfig();
            config.adminPassword = newPass;
            StorageManager.saveConfig(config);

            showNotification('Contraseña actualizada correctamente');
            elements.newAdminPassword.value = '';
            elements.confirmAdminPassword.value = '';
        });
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const isError = type === 'error';
        const bgColor = isError ? 'rgba(220, 38, 38, 0.95)' : 'rgba(16, 185, 129, 0.95)';
        const icon = isError ? 'alert-circle' : 'check-circle';

        // Vibration and sound for errors
        if (isError) {
            // Vibrate (mobile devices)
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]); // vibrate-pause-vibrate pattern
            }

            // Play error sound using Web Audio API
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.frequency.value = 400; // Low frequency buzz
                oscillator.type = 'square';
                gainNode.gain.value = 0.3;

                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                oscillator.stop(audioCtx.currentTime + 0.2);
            } catch (e) {
                console.log('Audio not supported');
            }
        }

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            animation: slideInDown 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        notification.innerHTML = `<i data-lucide="${icon}" style="width: 18px; height: 18px;"></i> ${message}`;
        document.body.appendChild(notification);
        lucide.createIcons();

        setTimeout(() => {
            notification.style.animation = 'fadeOutUp 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    // Initialize Cloud Sync
    if (typeof StorageManager.initCloudSync === 'function') {
        StorageManager.initCloudSync(
            // Orders callback
            () => {
                if (state.currentPage === 'checkout') renderCheckoutPage();
                if (state.currentPage === 'history') renderHistoryPage();
                if (state.currentPage === 'new-order') updateOrderTotal();
            },
            // Config callback (Admin changes from other devices)
            () => {
                if (state.currentPage === 'admin') renderAdminPage();
                if (state.currentPage === 'new-order') {
                    initializeCategories();
                    updateOrderTotal();
                }
                console.log('Config synced from cloud');
            },
            // Print callback (Remote print from other devices) - DISABLED
            null
        );
    }

    // Initialize
    updateOrderTotal();
});
