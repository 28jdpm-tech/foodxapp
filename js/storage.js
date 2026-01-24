// ============================================
// FoodX POS - Storage Manager
// ============================================

const STORAGE_KEYS = {
    ORDERS: 'foodx_orders',
    SETTINGS: 'foodx_settings',
    CATEGORIES: 'foodx_categories',
    FLAVORS: 'foodx_flavors',
    EXTRAS: 'foodx_extras',
    PRICES: 'foodx_prices'
};

const StorageManager = {
    // Get all orders
    getOrders() {
        const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
        return data ? JSON.parse(data) : [];
    },

    // Save all orders
    saveOrders(orders) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    },

    // Delete order
    deleteOrder(orderId) {
        let orders = this.getOrders();
        orders = orders.filter(o => o.id !== orderId);
        this.saveOrders(orders);
    },

    // Get orders by status
    getOrdersByStatus(status) {
        return this.getOrders().filter(o => o.status === status);
    },

    // Get active orders (not delivered)
    getActiveOrders() {
        return this.getOrders().filter(o => o.status !== 'delivered');
    },

    // Get order counts by status
    getOrderCounts() {
        const orders = this.getOrders();
        return {
            pending: orders.filter(o => o.status === 'pending').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length
        };
    },

    // Configuration Management
    getConfig() {
        const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        const flavors = localStorage.getItem(STORAGE_KEYS.FLAVORS);
        const extras = localStorage.getItem(STORAGE_KEYS.EXTRAS);
        const observations = localStorage.getItem('foodx_observations');
        const prices = localStorage.getItem(STORAGE_KEYS.PRICES);

        return {
            categories: categories ? JSON.parse(categories) : FOODX_DATA.categories,
            flavors: flavors ? JSON.parse(flavors) : FOODX_DATA.flavors,
            extras: extras ? JSON.parse(extras) : FOODX_DATA.extras,
            observations: observations ? JSON.parse(observations) : FOODX_DATA.observations,
            prices: prices ? JSON.parse(prices) : FOODX_DATA.prices
        };
    },

    saveConfig(config) {
        if (config.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(config.categories));
        if (config.flavors) localStorage.setItem(STORAGE_KEYS.FLAVORS, JSON.stringify(config.flavors));
        if (config.extras) localStorage.setItem(STORAGE_KEYS.EXTRAS, JSON.stringify(config.extras));
        if (config.observations) localStorage.setItem('foodx_observations', JSON.stringify(config.observations));
        if (config.prices) localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(config.prices));

        // Update the global object too so the app uses latest
        Object.assign(FOODX_DATA, config);
    },

    // Today's orders
    getTodayOrders() {
        const today = new Date().toDateString();
        return this.getOrders().filter(o => new Date(o.createdAt).toDateString() === today);
    },

    // Get orders by specific date (YYYY-MM-DD)
    getOrdersByDate(dateStr) {
        if (!dateStr) return [];
        const searchDate = new Date(dateStr + 'T00:00:00').toDateString();
        return this.getOrders().filter(o => new Date(o.createdAt).toDateString() === searchDate);
    },

    // --- Firebase Sync Methods ---

    // Sync order to Cloud
    async syncOrderToCloud(order) {
        try {
            await db.collection('orders').doc(order.id).set(order);
        } catch (e) {
            console.error("Error syncing order:", e);
        }
    },

    // Listen for Cloud changes
    initCloudSync(callback) {
        db.collection('orders').onSnapshot((snapshot) => {
            let orders = this.getOrders();
            let hasChanges = false;

            snapshot.docChanges().forEach((change) => {
                const cloudOrder = change.doc.data();
                const localIndex = orders.findIndex(o => o.id === cloudOrder.id);

                if (change.type === "added" || change.type === "modified") {
                    if (localIndex === -1) {
                        orders.push(cloudOrder);
                        hasChanges = true;
                    } else if (JSON.stringify(orders[localIndex]) !== JSON.stringify(cloudOrder)) {
                        orders[localIndex] = cloudOrder;
                        hasChanges = true;
                    }
                }
                if (change.type === "removed" && localIndex !== -1) {
                    orders.splice(localIndex, 1);
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.saveOrders(orders);
                if (callback) callback();
            }
        });
    },

    // --- Original methods with cloud hooks ---

    addOrder(order) {
        order.id = generateId();
        order.createdAt = new Date().toISOString();
        const orders = this.getOrders();
        orders.push(order);
        this.saveOrders(orders);
        this.syncOrderToCloud(order); // Hook
        return order;
    },

    updateOrder(orderId, updates) {
        const orders = this.getOrders();
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates, modifiedAt: new Date().toISOString() };
            this.saveOrders(orders);
            this.syncOrderToCloud(orders[index]); // Hook
            return orders[index];
        }
        return null;
    },

    // Clear all data (for testing)
    clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    }
};

// Initialize FOODX_DATA from storage if exists
(function initConfig() {
    const config = StorageManager.getConfig();
    Object.assign(FOODX_DATA, config);
})();
