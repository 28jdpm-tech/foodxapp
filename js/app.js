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

    // Sync Core Data (Bebidas Migration)
    (function syncBebidas() {
        const config = StorageManager.getConfig();
        const hasBebidas = config.categories.some(c => c.id === 'bebidas');
        if (!hasBebidas) {
            config.categories.push({ id: 'bebidas', name: 'Bebidas', icon: '🥤', active: true });
            config.prices['bebidas'] = { XS: 0, XM: 0, XL: 0 };
            if (!config.flavors['bebidas']) {
                config.flavors['bebidas'] = [
                    { id: 'b1', name: 'Coca-Cola', price: 5000, active: true },
                    { id: 'b2', name: 'Pepsi', price: 4500, active: true },
                    { id: 'b3', name: 'Agua', price: 3000, active: true }
                ];
            }
            StorageManager.saveConfig(config);
        }
    })();

    // Initialize all categories (including those added dynamically or via sync)
    function initializeCategories() {
        const sections = document.querySelectorAll('.category-section');
        sections.forEach(section => {
            const category = section.dataset.category;

            // Init state for category if not exists
            if (!state.categoryData[category]) {
                state.categoryData[category] = { rows: [] };
            }

            // Attach listener to Add Row button only if not already attached
            const addRowBtn = section.querySelector('.add-row-btn');
            if (addRowBtn && !addRowBtn.dataset.listenerAttached) {
                addRowBtn.addEventListener('click', () => {
                    addNewRow(category);
                });
                addRowBtn.dataset.listenerAttached = 'true';
            }
        });
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
        pendingPaymentCount: document.getElementById('pendingPaymentCount'),
        paidOrdersCount: document.getElementById('paidOrdersCount'),
        pendingPaymentList: document.getElementById('pendingPaymentList'),
        paidOrdersList: document.getElementById('paidOrdersList'),
        paymentModal: document.getElementById('paymentModal'),
        paymentOrderNum: document.getElementById('paymentOrderNum'),
        paymentTicketContent: document.getElementById('paymentTicketContent'),
        paymentTotal: document.getElementById('paymentTotal'),
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
        adminCategorySelect: document.getElementById('adminCategorySelect'),
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
        const extraOptions = config.extras.filter(e => e.active).map(e =>
            `<option value="${e.id}">${e.name}</option>`
        ).join('');
        const obsOptions = config.observations.filter(o => o.active).map(o =>
            `<option value="${o.id}">${o.name.substring(0, 12)}</option>`
        ).join('');

        const isBebida = category === 'bebidas';
        rowEl.innerHTML = `
            <div class="row-fields ${isBebida ? 'bebidas-row' : ''}">
                <div class="field-col qty-col">
                    <label>#</label>
                    <div class="field-content">
                        <input type="number" value="1" min="1" max="99" class="qty-input">
                    </div>
                </div>
                <div class="field-col flavor-col">
                    <label>${isBebida ? 'BEBIDA' : 'S1'}</label>
                    <div class="field-content">
                        <select class="flavor-select" data-block="1">
                            <option value="">Sel.</option>
                            ${flavorOptions}
                        </select>
                    </div>
                </div>
                ${!isBebida ? `
                <div class="field-col flavor-col">
                    <label>S2</label>
                    <div class="field-content">
                        <select class="flavor-select" data-block="2">
                            <option value="">Sel.</option>
                            ${flavorOptions}
                        </select>
                    </div>
                </div>
                <div class="field-col flavor-col">
                    <label>S3</label>
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

        const qtyInput = rowEl.querySelector('.qty-input');
        if (qtyInput) {
            qtyInput.addEventListener('change', () => {
                const data = getRowData();
                if (data) {
                    data.qty = parseInt(qtyInput.value) || 1;
                    updateCategoryTotal(category);
                    updateOrderTotal();
                }
            });
        }

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
                    const size = calculateSize(filledBlocks);
                    sizeLabel = size;
                    const basePrice = config.prices[category][size];
                    const extraData = data.extra ? config.extras.find(e => e.id === data.extra) : null;
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
                    const size = isBebida ? '' : calculateSize(filledBlocks.length);

                    const flavorNames = rowData.blocks.filter(b => b).map(b => {
                        const flavor = config.flavors[category].find(f => f.id === b);
                        return flavor ? flavor.name : '';
                    });

                    const extraData = rowData.extra ? config.extras.find(e => e.id === rowData.extra) : null;
                    const extraName = extraData ? extraData.name : '';
                    const extraPrice = extraData ? extraData.price : 0;

                    const obsData = rowData.observation ? config.observations.find(o => o.id === rowData.observation) : null;
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
                printed: false
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
            }
        });

        // Reset Service Type
        state.serviceType = 'salon';
        elements.serviceTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.service === 'salon') tab.classList.add('active');
        });

        updateOrderTotal();
    }

    // ============================================
    // Checkout / Payment
    // ============================================

    let checkoutMode = 'pending';
    let selectedPaymentOrder = null;

    function renderCheckoutPage() {
        const orders = StorageManager.getOrders();
        const pending = orders.filter(o => !o.paid);
        const paid = orders.filter(o => o.paid);

        if (elements.pendingPaymentCount) elements.pendingPaymentCount.textContent = pending.length;
        if (elements.paidOrdersCount) elements.paidOrdersCount.textContent = paid.length;

        if (elements.pendingPaymentList) elements.pendingPaymentList.innerHTML = pending.reverse().map(o => createCheckoutCard(o)).join('');
        if (elements.paidOrdersList) elements.paidOrdersList.innerHTML = paid.reverse().map(o => createCheckoutCard(o)).join('');

        if (checkoutMode === 'pending') {
            elements.pendingPaymentList?.classList.remove('hidden');
            elements.paidOrdersList?.classList.add('hidden');
        } else {
            elements.pendingPaymentList?.classList.add('hidden');
            elements.paidOrdersList?.classList.remove('hidden');
        }

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
        if (order.paid) {
            modalTitle.textContent = 'Pedido Pagado - Detalle';
            elements.confirmPayment.style.display = 'none';
        } else {
            modalTitle.textContent = 'Cobrar Pedido';
            elements.confirmPayment.style.display = 'flex';
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
                StorageManager.updateOrder(selectedPaymentOrder.id, { paid: true });
                showNotification(`Pedido ${selectedPaymentOrder.orderNumber} pagado`);
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
        const labels = { salon: 'SALÓN', llevar: 'LLEVAR', domicilio: 'DOMICILIO' };
        const now = new Date(order.createdAt || Date.now());
        const dateStr = now.toLocaleDateString('es-CO');
        const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        const pad = (str, len, right = false) => {
            str = String(str);
            if (str.length > len) return str.substring(0, len);
            return right ? str.padEnd(len) : str.padStart(len);
        };

        const abbr = (str) => str ? str.substring(0, 4).toUpperCase() : '----';

        let ticket = '';
        ticket += '==========================================\n';
        ticket += '              FOODX POS PRO               \n';
        ticket += `               ORDEN ${order.orderNumber || 'PREVIEW'}               \n`;
        ticket += '==========================================\n';
        ticket += ` FECHA: ${dateStr}   HORA: ${timeStr}\n`;
        ticket += ` TIPO: ${labels[order.serviceType]}\n`;
        ticket += '------------------------------------------\n';

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
            ticket += `\n   >>> ${cat.name.toUpperCase()} (${catTotalQty}) <<<\n`;
            ticket += ' # | PRODUCTO    | ADIC\n';
            ticket += '---|-------------|------\n';

            cat.items.forEach((item, idx) => {
                const isBebida = item.category === 'bebidas';

                if (isBebida) {
                    const fullName = item.flavors.join(' - ').length > 0 ? item.flavors.join(' - ').toUpperCase() : 'BEBIDA';
                    ticket += `${pad(item.qty, 2)} | ${pad(fullName, 15, true)}\n`;
                } else {
                    const flavorStr = item.flavors.map(f => abbr(f)).join('-');
                    const extraStr = item.extras.length > 0 ? item.extras[0].substring(0, 6).toUpperCase() : '----';

                    ticket += `${pad(item.qty, 2)} | ${pad(flavorStr, 11, true)} | ${extraStr}\n`;
                }

                // Show observation below product only if exists
                if (item.observations && item.observations.trim() !== '') {
                    ticket += `     >> OBS: ${item.observations.toUpperCase()}\n`;
                }
            });
        });

        ticket += '\n------------------------------------------\n';
        ticket += ` TOTAL VENTA: ${formatPrice(order.totalPrice)}\n`;
        ticket += '==========================================\n';
        ticket += '          GRACIAS POR SU COMPRA           \n';
        ticket += '==========================================\n';

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
        if (tab === 'categories') renderCategoriesList(config.categories);
        else if (tab === 'flavors') {
            populateAdminCategorySelect(config.categories);
            renderFlavorsList(config.flavors, elements.adminCategorySelect.value);
        } else if (tab === 'extras') renderExtrasList(config.extras);
        else if (tab === 'observations') renderObsList(config.observations);
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

    function populateAdminCategorySelect(categories) {
        if (!elements.adminCategorySelect) return;
        const current = elements.adminCategorySelect.value;
        elements.adminCategorySelect.innerHTML = categories.map(cat => `<option value="${cat.id}" ${cat.id === current ? 'selected' : ''}>${cat.name}</option>`).join('');
    }

    if (elements.adminCategorySelect) {
        elements.adminCategorySelect.addEventListener('change', () => {
            renderFlavorsList(StorageManager.getConfig().flavors, elements.adminCategorySelect.value);
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

    function renderExtrasList(extras) {
        if (!elements.adminExtrasList) return;
        elements.adminExtrasList.innerHTML = extras.map(e => `
            <div class="admin-item">
                <div class="admin-item-info"><span>${e.name}</span><span>${formatPrice(e.price)}</span></div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="window.editAdminItem('extra', '${e.id}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="window.deleteAdminItem('extra', '${e.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    function renderObsList(obs) {
        if (!elements.adminObsList) return;
        elements.adminObsList.innerHTML = obs.map(o => `
            <div class="admin-item">
                <div class="admin-item-info"><span>${o.name}</span></div>
                <div class="admin-item-actions">
                    <button class="btn-icon" onclick="window.editAdminItem('observation', '${o.id}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="window.deleteAdminItem('observation', '${o.id}')">
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
            html = `<div class="form-group"><label>Nombre</label><input type="text" id="editName" value="${item.name}"></div>
                    <div class="form-group"><label>Icono</label><input type="text" id="editIcon" value="${item.icon}"></div>
                    <div class="form-row">
                        <div class="form-group"><label>XS</label><input type="number" id="priceXS" value="${config.prices[id].XS}"></div>
                        <div class="form-group"><label>XM</label><input type="number" id="priceXM" value="${config.prices[id].XM}"></div>
                    </div>
                    <div class="form-group"><label>XL</label><input type="number" id="priceXL" value="${config.prices[id].XL}"></div>`;
        } else if (type === 'flavor') {
            const item = config.flavors[parentId].find(f => f.id === id);
            const isBebida = parentId === 'bebidas';
            html = `<div class="form-group"><label>Nombre</label><input type="text" id="editName" value="${item.name}"></div>
                    ${isBebida ? `<div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="${item.price || 0}"></div>` : ''}`;
        } else if (type === 'extra') {
            const item = config.extras.find(e => e.id === id);
            html = `<div class="form-group"><label>Nombre</label><input type="text" id="editName" value="${item.name}"></div>
                    <div class="form-group"><label>Precio</label><input type="number" id="editPrice" value="${item.price}"></div>`;
        } else if (type === 'observation') {
            const item = config.observations.find(o => o.id === id);
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
        }
        else if (type === 'flavor') config.flavors[pId] = config.flavors[pId].filter(f => f.id !== id);
        else if (type === 'extra') config.extras = config.extras.filter(e => e.id !== id);
        else if (type === 'observation') config.observations = config.observations.filter(o => o.id !== id);

        StorageManager.saveConfig(config);
        renderAdminPage();
        showNotification('Eliminado correctamente');
    };

    // Initialize admin tabs
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

    if (elements.cancelAdminModal) elements.cancelAdminModal.onclick = () => elements.adminModal.classList.remove('open');
    if (elements.confirmAdminModal) {
        elements.confirmAdminModal.onclick = () => {
            const config = StorageManager.getConfig();
            const { type, id, parentId } = adminEditContext;
            const name = document.getElementById('editName').value;
            if (type === 'category') {
                const cat = id ? config.categories.find(c => c.id === id) : { id: 'cat_' + Date.now() };
                cat.name = name; cat.icon = document.getElementById('editIcon').value;
                if (!id) { config.categories.push(cat); config.flavors[cat.id] = []; }
                config.prices[cat.id] = { XS: +document.getElementById('priceXS').value, XM: +document.getElementById('priceXM').value, XL: +document.getElementById('priceXL').value };
            } else if (type === 'flavor') {
                const f = id ? config.flavors[parentId].find(x => x.id === id) : { id: 'f_' + Date.now() };
                f.name = name;
                if (parentId === 'bebidas') f.price = +document.getElementById('editPrice').value;
                if (!id) config.flavors[parentId].push(f);
            } else if (type === 'extra') {
                const e = id ? config.extras.find(x => x.id === id) : { id: 'e_' + Date.now() };
                e.name = name; e.price = +document.getElementById('editPrice').value;
                if (!id) config.extras.push(e);
            } else if (type === 'observation') {
                const o = id ? config.observations.find(x => x.id === id) : { id: 'o_' + Date.now() };
                o.name = name; if (!id) config.observations.push(o);
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
            elements.adminModalBody.innerHTML = `<div class="form-group"><label>Nombre</label><input type="text" id="editName"></div>
                <div class="form-group"><label>Icono</label><input type="text" id="editIcon"></div>
                <div class="form-row"><div class="form-group"><label>XS</label><input type="number" id="priceXS"></div>
                <div class="form-group"><label>XM</label><input type="number" id="priceXM"></div></div>
                <div class="form-group"><label>XL</label><input type="number" id="priceXL"></div>`;
            elements.adminModal.classList.add('open');
        };
    }

    if (elements.addFlavorBtn) {
        elements.addFlavorBtn.onclick = () => {
            const catId = elements.adminCategorySelect.value;
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
            adminEditContext = { type: 'extra', id: null };
            elements.adminModalTitle.textContent = 'Nuevo Extra';
            elements.adminModalBody.innerHTML = `<div class="form-group"><label>Nombre</label><input type="text" id="editName"></div>
                <div class="form-group"><label>Precio</label><input type="number" id="editPrice"></div>`;
            elements.adminModal.classList.add('open');
        };
    }

    if (elements.addObsBtn) {
        elements.addObsBtn.onclick = () => {
            adminEditContext = { type: 'observation', id: null };
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
                    refreshOrderPageUI();
                }
                console.log('Config synced from cloud');
            },
            // Print callback (Remote print from other devices)
            (order) => {
                // Show print notification
                showNotification(`📢 Nuevo pedido ${order.orderNumber} - Imprimiendo...`);

                // Show ticket modal with this order
                if (elements.ticketContent && elements.ticketModal) {
                    elements.ticketContent.textContent = generateTicketText(order);
                    elements.ticketModal.classList.add('open');

                    // Auto-print after a short delay
                    setTimeout(() => {
                        window.print();

                        // Mark as printed in cloud
                        StorageManager.updateOrder(order.id, { printed: true });

                        // Close modal
                        elements.ticketModal.classList.remove('open');
                    }, 500);
                }
            }
        );
    }

    // Initialize
    updateOrderTotal();
});
