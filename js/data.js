// ============================================
// FoodX POS - Data Configuration
// ============================================

const FOODX_DATA = {
    // Categories
    categories: [
        { id: 'hamburguesas', name: 'Hamburguesas', icon: '🍔', active: true },
        { id: 'perros', name: 'Perros', icon: '🌭', active: true },
        { id: 'salchipapas', name: 'Salchipapas', icon: '🍟', active: true },
        { id: 'bebidas', name: 'Bebidas', icon: '🥤', active: true }
    ],

    // Flavors by category
    flavors: {
        hamburguesas: [
            { id: 'h1', name: 'Clásica', active: true },
            { id: 'h2', name: 'BBQ', active: true },
            { id: 'h3', name: 'Mexicana', active: true },
            { id: 'h4', name: 'Hawaiana', active: true },
            { id: 'h5', name: 'Doble Carne', active: true },
            { id: 'h6', name: 'Ranchera', active: true },
            { id: 'h7', name: 'Crispy', active: true },
            { id: 'h8', name: 'Especial FoodX', active: true }
        ],
        perros: [
            { id: 'p1', name: 'Tradicional', active: true },
            { id: 'p2', name: 'Americano', active: true },
            { id: 'p3', name: 'Mexicano', active: true },
            { id: 'p4', name: 'Súper Perro', active: true },
            { id: 'p5', name: 'Con Queso', active: true },
            { id: 'p6', name: 'Ranchero', active: true }
        ],
        salchipapas: [
            { id: 's1', name: 'Normal', active: true },
            { id: 's2', name: 'Con Queso', active: true },
            { id: 's3', name: 'Mixta', active: true },
            { id: 's4', name: 'Especial', active: true },
            { id: 's5', name: 'Super Salchi', active: true }
        ],
        bebidas: [
            { id: 'b1', name: 'Coca-Cola', price: 5000, active: true },
            { id: 'b2', name: 'Pepsi', price: 4500, active: true },
            { id: 'b3', name: 'Agua', price: 3000, active: true },
            { id: 'b4', name: 'Jugo Natural', price: 6000, active: true },
            { id: 'b5', name: 'Té Hielo', price: 5500, active: true },
            { id: 'b6', name: 'Cerveza', price: 7000, active: true }
        ]
    },

    // Extras/Additions
    extras: [
        { id: 'e1', name: 'Queso Extra', price: 2000, active: true },
        { id: 'e2', name: 'Tocineta', price: 3000, active: true },
        { id: 'e3', name: 'Huevo', price: 1500, active: true },
        { id: 'e4', name: 'Pepinillos', price: 1000, active: true },
        { id: 'e5', name: 'Jalapeños', price: 1000, active: true },
        { id: 'e6', name: 'Salsa BBQ', price: 500, active: true },
        { id: 'e7', name: 'Guacamole', price: 2500, active: true },
        { id: 'e8', name: 'Carne Extra', price: 5000, active: true }
    ],

    // Observations/Special requests
    observations: [
        { id: 'o1', name: 'Sin cebolla', active: true },
        { id: 'o2', name: 'Sin tomate', active: true },
        { id: 'o3', name: 'Sin lechuga', active: true },
        { id: 'o4', name: 'Sin salsa', active: true },
        { id: 'o5', name: 'Extra salsa', active: true },
        { id: 'o6', name: 'Bien cocido', active: true },
        { id: 'o7', name: 'Término medio', active: true },
        { id: 'o8', name: 'Sin picante', active: true },
        { id: 'o9', name: 'Extra picante', active: true },
        { id: 'o10', name: 'Para niño', active: true }
    ],

    // Prices by category and size
    prices: {
        hamburguesas: { XS: 12000, XM: 18000, XL: 24000 },
        perros: { XS: 8000, XM: 12000, XL: 16000 },
        salchipapas: { XS: 10000, XM: 15000, XL: 20000 },
        bebidas: { XS: 0, XM: 0, XL: 0 }
    },

    // Service types
    serviceTypes: [
        { id: 'salon', name: 'Salón', icon: 'armchair', label: 'Mesa' },
        { id: 'llevar', name: 'Para Llevar', icon: 'shopping-bag', label: 'Nombre' },
        { id: 'domicilio', name: 'Domicilio', icon: 'bike', label: 'Dirección/Nombre' }
    ]
};

// Size calculation based on number of blocks
function calculateSize(blocksCount, category = '') {
    if (category === 'combos') {
        switch (blocksCount) {
            case 1: return 'HB';
            case 2: return 'PE';
            case 3: return 'SA';
            default: return 'HB';
        }
    }

    switch (blocksCount) {
        case 1: return 'XS';
        case 2: return 'XM';
        case 3: return 'XL';
        default: return 'XS';
    }
}

// Format price to Colombian pesos
function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate order number
let orderCounter = parseInt(localStorage.getItem('foodx_order_counter') || '0');
function generateOrderNumber() {
    orderCounter++;
    localStorage.setItem('foodx_order_counter', orderCounter.toString());
    return '#' + String(orderCounter).padStart(3, '0');
}
