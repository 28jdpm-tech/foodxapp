// ============================================
// FoodX POS PRO - Multiple Client Rows System
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // App State
    const state = {
        currentPage: 'new-order',
        serviceType: 'salon',
        orderTotal: 0,
        categoryData: {},
        rowCounter: 0
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
        // Checkout / Payment
        toPrintCount: document.getElementById('toPrintCount'),
        pendingPaymentCount: document.getElementById('pendingPaymentCount'),
        paidOrdersCount: document.getElementById('paidOrdersCount'),
        toPrintList: document.getElementById('toPrintList'),
        pendingPaymentList: document.getElementById('pendingPaymentList'),
        paidOrdersList: document.getElementById('paidOrdersList'),
        paymentModal: document.getElementById('paymentModal'),
        paymentOrderNum: document.getElementById('paymentOrderNum'),
        paymentTicketContent: document.getElementById('paymentTicketContent'),
        paymentTotal: document.getElementById('paymentTotal'),
        printPaymentTicket: document.getElementById('printPaymentTicket'),
        cancelPayment: document.getElementById('cancelPayment'),
        confirmPayment: document.getElementById('confirmPayment'),
        // Ticket Modal
        ticketModal: document.getElementById('ticketModal'),
        ticketContent: document.getElementById('ticketContent'),
        cancelTicket: document.getElementById('cancelTicket'),
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
        historyOrderDetail: document.getElementById('historyOrderDetail'),
        historyTicketContent: document.getElementById('historyTicketContent'),
        backToHistoryBtn: document.getElementById('backToHistoryBtn'),
        reprintOrderBtn: document.getElementById('reprintOrderBtn'),
        // Reports
        reportDatePicker: document.getElementById('reportDatePicker'),
        searchReportBtn: document.getElementById('searchReportBtn'),
    };

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
                initializeCategories();
                refreshOrderPageUI();
            }

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
            extra: '',
            observation: ''
        };

        const config = StorageManager.getConfig();
        state.categoryData[category].rows.push(rowData);

        const rowEl = document.createElement('div');
        rowEl.className = 'client-row';
        rowEl.dataset.rowId = rowId;

        const flavors = config.flavors[category] || [];
        const flavorOptions = flavors.map(f => `<option value="${f.id}">${f.name.substring(0, 8)}</option>`).join('');

        // Use category-specific extras and observations
        const categoryExtras = (config.extras && config.extras[category]) || [];
        const extraOptions = categoryExtras.filter(e => e.active !== false).map(e =>
            `<option value="${e.id}">${e.name}</option>`
        ).join('');

        const categoryObs = (config.observations && config.observations[category]) || [];
        const obsOptions = categoryObs.filter(o => o.active !== false).map(o =>
            `<option value="${o.id}">${o.name.substring(0, 12)}</option>`
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
                        <select class="extra-select">
                            <option value="">Sel.</option>
                            ${extraOptions}
                        </select>
                    </div>
                </div>
                <div class="field-col flavor-col">
                    <label>OBS</label>
                    <div class="field-content">
                        <select class="obs-select">
                            <option value="">Sel.</option>
                            ${obsOptions}
                        </select>
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

        const extraSelect = rowEl.querySelector('.extra-select');
        if (extraSelect) {
            extraSelect.addEventListener('change', () => {
                const data = getRowData();
                if (data) {
                    data.extra = extraSelect.value;
                    updateCategoryTotal(category);
                    updateOrderTotal();
                }
            });
        }

        const obsSelect = rowEl.querySelector('.obs-select');
        if (obsSelect) {
            obsSelect.addEventListener('change', () => {
                const data = getRowData();
                if (data) {
                    data.observation = obsSelect.value;
                }
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
                    const categoryExtras = config.extras[category] || [];
                    const extraData = data.extra ? categoryExtras.find(e => e.id === data.extra) : null;
                    const extraPrice = extraData ? extraData.price : 0;
                    rowPrice = (basePrice + extraPrice) * data.qty;
                }
                total += rowPrice;
            }

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
        elements.sendToKitchenBtn.addEventListener('click', () => {
            const config = StorageManager.getConfig();
            const items = [];

            Object.keys(state.categoryData).forEach(category => {
                const categoryInfo = config.categories.find(c => c.id === category);

                state.categoryData[category].rows.forEach(rowData => {
                    const filledBlocks = rowData.blocks.filter(b => b !== '');
                    if (filledBlocks.length === 0) return;

                    const isBebida = category === 'bebidas';
                    const size = isBebida ? '' : calculateSize(filledBlocks.length, category);

                    const flavorNames = rowData.blocks.filter(b => b).map(b => {
                        const flavor = config.flavors[category].find(f => f.id === b);
                        return flavor ? flavor.name : '';
                    });

                    const categoryExtras = config.extras[category] || [];
                    const extraData = rowData.extra ? categoryExtras.find(e => e.id === rowData.extra) : null;
                    const extraName = extraData ? extraData.name : '';
                    const extraPrice = extraData ? extraData.price : 0;

                    const categoryObs = config.observations[category] || [];
                    const obsData = rowData.observation ? categoryObs.find(o => o.id === rowData.observation) : null;
                    const obsName = obsData ? obsData.name : '';

                    let basePrice = 0;
                    if (isBebida) {
                        const flavor = config.flavors[category].find(f => f.id === rowData.blocks[0]);
                        basePrice = flavor ? flavor.price : 0;
                    } else {
                        basePrice = config.prices[category][size];
                    }

                    items.push({
                        id: generateId(),
                        category: category,
                        categoryName: categoryInfo.name,
                        categoryIcon: categoryInfo.icon,
                        qty: rowData.qty,
                        size: size,
                        flavors: flavorNames,
                        extras: extraName ? [extraName] : [],
                        observations: obsName,
                        price: (basePrice + extraPrice) * rowData.qty
                    });
                });
            });

            if (items.length === 0) {
                showNotification('Selecciona al menos un producto');
                return;
            }

            pendingOrder = {
                orderNumber: generateOrderNumber(),
                serviceType: state.serviceType,
                customerInfo: state.serviceType === 'salon' ? 'Mesa' : state.serviceType === 'llevar' ? 'Para llevar' : 'Domicilio',
                items: items,
                status: 'pending',
                totalPrice: items.reduce((sum, item) => sum + item.price, 0),
                createdBy: 'Cajero 1',
                needsPrint: true,
                printed: false,
                checkoutPrinted: false
            };

            showTicketModal(pendingOrder);
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

    if (elements.printTicket) {
        elements.printTicket.addEventListener('click', () => {
            if (pendingOrder) {
                // Mark as printed before saving
                // Mark as printed before saving
                pendingOrder.printed = true;

                // Save Order
                StorageManager.addOrder(pendingOrder);

                // Show Printing Dialog
                window.print();

                // Success Notification
                showNotification(`Pedido ${pendingOrder.orderNumber} impreso y guardado`);

                // Close Modal & Reset
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
        const toPrint = orders.filter(o => !o.paid && !o.checkoutPrinted);
        const pending = orders.filter(o => !o.paid && o.checkoutPrinted);
        const paid = orders.filter(o => o.paid);

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
                            <span class="kitchen-order-number">${o.orderNumber}</span>
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
                    <span class="order-total">${formatPrice(order.totalPrice)}</span>
                    ${order.paid ? '<span class="status-indicator paid-chip">PAGADO</span>' : ''}
                </div>
            </div>
        `;
    }

    function openPaymentModal(orderId) {
        const order = StorageManager.getOrders().find(o => o.id === orderId);
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
        } else if (!order.checkoutPrinted) {
            modalTitle.textContent = 'Imprimir Ticket de Cobro';
            elements.confirmPayment.style.display = 'none';
            elements.printPaymentTicket.style.display = 'flex';
        } else {
            modalTitle.textContent = 'Cobrar Pedido';
            elements.confirmPayment.style.display = 'flex';
            elements.printPaymentTicket.style.display = 'flex'; // Allow re-print even if in pending
        }

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

    if (elements.confirmPayment) {
        elements.confirmPayment.addEventListener('click', () => {
            if (selectedPaymentOrder) {
                StorageManager.updateOrder(selectedPaymentOrder.id, { paid: true, status: 'delivered' });
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
                // Set as printed for checkout
                StorageManager.updateOrder(selectedPaymentOrder.id, { checkoutPrinted: true });

                // Show Printing Dialog
                window.print();

                // Refresh and close if needed (or just refresh)
                showNotification(`Pedido ${selectedPaymentOrder.orderNumber} enviado a cobrar`);
                elements.paymentModal.classList.add('hidden');
                renderCheckoutPage();
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
        const filterDate = elements.reportDatePicker?.value;
        const orders = filterDate
            ? StorageManager.getOrdersByDate(filterDate)
            : StorageManager.getTodayOrders();

        const paidOrders = orders.filter(o => o.paid);

        const totalSales = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        const totalOrders = paidOrders.length;
        const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Update stats
        if (document.getElementById('reportDailySales')) document.getElementById('reportDailySales').textContent = formatPrice(totalSales);
        if (document.getElementById('reportDailyOrders')) document.getElementById('reportDailyOrders').textContent = totalOrders;
        if (document.getElementById('reportAvgTicket')) document.getElementById('reportAvgTicket').textContent = formatPrice(avgTicket);

        // Category Sales
        const categorySales = {};
        paidOrders.forEach(order => {
            order.items.forEach(item => {
                const catName = item.categoryName;
                categorySales[catName] = (categorySales[catName] || 0) + item.price;
            });
        });

        const container = document.getElementById('categorySalesList');
        if (container) {
            const sortedCats = Object.entries(categorySales).sort((a, b) => b[1] - a[1]);
            const maxSales = sortedCats.length > 0 ? sortedCats[0][1] : 1;

            container.innerHTML = sortedCats.map(([name, amount]) => {
                const percentage = (amount / maxSales) * 100;
                return `
                    <div class="category-sales-item">
                        <span class="cat-sales-name">${name}</span>
                        <div class="cat-sales-bar-bg">
                            <div class="cat-sales-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="cat-sales-amount">${formatPrice(amount)}</span>
                    </div>
                `;
            }).join('') || '<div class="empty-state">No hay ventas registradas hoy</div>';
        }

        lucide.createIcons();
    }

    if (elements.searchReportBtn) {
        elements.searchReportBtn.addEventListener('click', () => {
            renderReportsPage();
        });
    }

    // ============================================
    // History
    // ============================================

    let historyMode = 'today';

    function renderHistoryPage() {
        const orders = historyMode === 'today'
            ? StorageManager.getTodayOrders().reverse()
            : StorageManager.getOrdersByDate(elements.historyDatePicker.value).reverse();

        renderHistoryOrdersList(orders);

        // Ensure detail is hidden and list is shown
        elements.historyOrderDetail.classList.add('hidden');
        elements.historyOrdersList.classList.remove('hidden');

        // Show/Hide date picker container
        if (historyMode === 'date') {
            elements.datePickerContainer.classList.remove('hidden');
        } else {
            elements.datePickerContainer.classList.add('hidden');
        }
    }

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

    if (elements.backToHistoryBtn) {
        elements.backToHistoryBtn.addEventListener('click', () => {
            elements.historyOrderDetail.classList.add('hidden');
            elements.historyOrdersList.classList.remove('hidden');
        });
    }

    let selectedHistoryOrder = null;

    function showOrderDetail(orderId) {
        const order = StorageManager.getOrders().find(o => o.id === orderId);
        if (!order) return;

        selectedHistoryOrder = order;
        elements.historyTicketContent.textContent = generateTicketText(order);

        elements.historyOrdersList.classList.add('hidden');
        elements.historyOrderDetail.classList.remove('hidden');
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
                    <span class="order-total">${formatPrice(order.totalPrice)}</span>
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

    function generateTicketText(order) {
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

        const tableLine = () => center("+---+---+---+---+");

        const tableHeader = () => {
            let h = tableLine() + "\n";
            h += center("|S1 |S2 |S3 |ADI|") + "\n";
            h += tableLine();
            return h;
        };

        const tableRow = (s1, s2, s3, adi) => {
            const f1 = (s1 || '---').substring(0, 3).toUpperCase().padEnd(3);
            const f2 = (s2 || '---').substring(0, 3).toUpperCase().padEnd(3);
            const f3 = (s3 || '---').substring(0, 3).toUpperCase().padEnd(3);
            const ad = (adi || '---').substring(0, 3).toUpperCase().padEnd(3);

            return center(`|${f1}|${f2}|${f3}|${ad}|`);
        };

        const topDivider = '='.repeat(TICKET_WIDTH);
        const subDivider = '-'.repeat(TICKET_WIDTH);

        let ticket = '';
        ticket += topDivider + '\n';
        ticket += center('FOODX POS PRO') + '\n';
        ticket += center(`ORDEN: ${order.orderNumber || '1024'}`) + '\n';
        ticket += topDivider + '\n';

        // Date and Time on same line, no labels
        ticket += justify(dateStr, timeStr) + '\n\n';
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

            // Full category name
            ticket += '\n  ' + `/// ${cat.name}(${catTotalQty}) ///`.toUpperCase() + '\n';
            ticket += tableHeader() + '\n';

            cat.items.forEach((item) => {
                const s1 = item.flavors[0] || '';
                const s2 = item.flavors[1] || '';
                const s3 = item.flavors[2] || '';
                const adi = item.extras[0] || '';

                // Table row layout
                ticket += tableRow(s1, s2, s3, adi) + '\n';
                ticket += tableLine() + '\n';

                // Observations line beneath
                if (item.observations && item.observations.trim() !== '') {
                    ticket += ' * ' + item.observations.toUpperCase() + '\n';
                }
            });
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
                <div class="admin-item-info"><span>${o.name}</span></div>
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
            html = `<div class="form-group"><label>Descripción</label><input type="text" id="editName" value="${item.name}"></div>`;
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
            elements.adminModalBody.innerHTML = `<div class="form-group"><label>Nombre</label><input type="text" id="editName"></div>`;
            elements.adminModal.classList.add('open');
        };
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            animation: slideInDown 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        notification.innerHTML = `<i data-lucide="check-circle" style="width: 18px; height: 18px;"></i> ${message}`;
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
            // Print callback (Remote print from other devices)
            (order) => {
                // Show ticket modal immediately overlaying the screen
                if (elements.ticketContent && elements.ticketModal) {
                    // Set the order as pending so print button works
                    pendingOrder = order;

                    // Display ticket
                    elements.ticketContent.textContent = generateTicketText(order);
                    elements.ticketModal.classList.add('open');

                    // Mark as printed in cloud immediately to prevent duplicates on other PCs
                    StorageManager.updateOrder(order.id, { printed: true });
                }
            }
        );
    }

    // Initialize
    updateOrderTotal();
});
