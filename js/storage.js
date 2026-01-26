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
        let categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        let flavors = localStorage.getItem(STORAGE_KEYS.FLAVORS);
        let extras = localStorage.getItem(STORAGE_KEYS.EXTRAS);
        let observations = localStorage.getItem('foodx_observations');
        let prices = localStorage.getItem(STORAGE_KEYS.PRICES);

        const config = {
            categories: categories ? JSON.parse(categories) : FOODX_DATA.categories,
            flavors: flavors ? JSON.parse(flavors) : FOODX_DATA.flavors,
            extras: extras ? JSON.parse(extras) : FOODX_DATA.extras,
            observations: observations ? JSON.parse(observations) : FOODX_DATA.observations,
            prices: prices ? JSON.parse(prices) : FOODX_DATA.prices
        };

        // Migration: If extras or observations are arrays, convert to objects keyed by category
        if (Array.isArray(config.extras)) {
            console.log("Migrating extras from array to category-object");
            const migrated = {};
            config.categories.forEach(c => {
                migrated[c.id] = JSON.parse(JSON.stringify(config.extras)); // Deep copy the common extras to each cat
            });
            config.extras = migrated;
            // Save migrated back immediately? Let's wait for next save
        }

        if (Array.isArray(config.observations)) {
            console.log("Migrating observations from array to category-object");
            const migrated = {};
            config.categories.forEach(c => {
                migrated[c.id] = JSON.parse(JSON.stringify(config.observations));
            });
            config.observations = migrated;
        }

        return config;
    },

    saveConfig(config) {
        // Validation: Ensure extras and observations are objects, not arrays
        if (Array.isArray(config.extras)) {
            const migrated = {};
            config.categories.forEach(c => migrated[c.id] = [...config.extras]);
            config.extras = migrated;
        }
        if (Array.isArray(config.observations)) {
            const migrated = {};
            config.categories.forEach(c => migrated[c.id] = [...config.observations]);
            config.observations = migrated;
        }

        if (config.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(config.categories));
        if (config.flavors) localStorage.setItem(STORAGE_KEYS.FLAVORS, JSON.stringify(config.flavors));
        if (config.extras) localStorage.setItem(STORAGE_KEYS.EXTRAS, JSON.stringify(config.extras));
        if (config.observations) localStorage.setItem('foodx_observations', JSON.stringify(config.observations));
        if (config.prices) localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(config.prices));

        // Update the global object too so the app uses latest
        Object.assign(FOODX_DATA, config);

        // Sync to cloud
        this.syncConfigToCloud(config);
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

    // Sync config to Cloud
    async syncConfigToCloud(config) {
        try {
            await db.collection('config').doc('main').set(config);
        } catch (e) {
            console.error("Error syncing config:", e);
        }
    },

    // Listen for Cloud changes (orders + config + print queue)
    initCloudSync(callback, configCallback, printCallback) {
        // Orders sync
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

                        // Check if this order needs printing on this device
                        if (cloudOrder.needsPrint && !cloudOrder.printed) {
                            if (printCallback) printCallback(cloudOrder);
                        }
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

        // Config sync
        db.collection('config').doc('main').onSnapshot((doc) => {
            if (doc.exists) {
                const cloudConfig = doc.data();
                const localConfig = this.getConfig();

                // Check if config changed
                if (JSON.stringify(cloudConfig) !== JSON.stringify(localConfig)) {
                    // Save locally
                    if (cloudConfig.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudConfig.categories));
                    if (cloudConfig.flavors) localStorage.setItem(STORAGE_KEYS.FLAVORS, JSON.stringify(cloudConfig.flavors));
                    if (cloudConfig.extras) localStorage.setItem(STORAGE_KEYS.EXTRAS, JSON.stringify(cloudConfig.extras));
                    if (cloudConfig.observations) localStorage.setItem('foodx_observations', JSON.stringify(cloudConfig.observations));
                    if (cloudConfig.prices) localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(cloudConfig.prices));

                    // Update global
                    Object.assign(FOODX_DATA, cloudConfig);

                    if (configCallback) configCallback();
                }
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

    // Printing and Drawer Settings
    getPrintingSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            printerType: 'browser',
            printerAddress: '',
            openDrawerOnPay: false,
            cashDrawerCommand: '27,112,0,25,250',
            businessName: 'FOODX POS',
            businessDetails: 'Nit: 123456789-0',
            footerMessage: 'Gracias por su compra'
        };
    },

    savePrintingSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        // Also sync to cloud if needed, but usually local for printer hardware
        this.syncSettingsToCloud(settings);
    },

    async syncSettingsToCloud(settings) {
        try {
            await db.collection('config').doc('settings').set(settings);
        } catch (e) {
            console.error("Error syncing settings:", e);
        }
    },

    // Clear all data (for testing)
    clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    }
};

// Flag to track if config has been loaded from cloud
StorageManager.configLoaded = false;

// Initialize FOODX_DATA from storage if exists, or from Firebase
(async function initConfig() {
    // Check if we have local config
    const hasLocalConfig = localStorage.getItem(STORAGE_KEYS.CATEGORIES) !== null;

    if (hasLocalConfig) {
        // Use local config
        const config = StorageManager.getConfig();
        Object.assign(FOODX_DATA, config);
        StorageManager.configLoaded = true;
    } else {
        // Try to load from Firebase first
        try {
            const doc = await db.collection('config').doc('main').get();
            if (doc.exists) {
                const cloudConfig = doc.data();

                // Save to localStorage
                if (cloudConfig.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudConfig.categories));
                if (cloudConfig.flavors) localStorage.setItem(STORAGE_KEYS.FLAVORS, JSON.stringify(cloudConfig.flavors));
                if (cloudConfig.extras) localStorage.setItem(STORAGE_KEYS.EXTRAS, JSON.stringify(cloudConfig.extras));
                if (cloudConfig.observations) localStorage.setItem('foodx_observations', JSON.stringify(cloudConfig.observations));
                if (cloudConfig.prices) localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(cloudConfig.prices));

                // Update global
                Object.assign(FOODX_DATA, cloudConfig);
                console.log('✅ Config loaded from Firebase');

                // Dispatch event to notify app that config was loaded from cloud
                window.dispatchEvent(new CustomEvent('configLoadedFromCloud'));
            }
        } catch (e) {
            console.log('Could not load config from Firebase, using defaults:', e);
        }
        StorageManager.configLoaded = true;
    }
})();
