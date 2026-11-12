// Basic Browser Mocks for Node.js Testing

// LocalStorage Mock
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

// ClassList Mock
class ClassListMock {
    constructor() {
        this.classes = new Set();
    }
    add(className) {
        this.classes.add(className);
    }
    remove(className) {
        this.classes.delete(className);
    }
    contains(className) {
        return this.classes.has(className);
    }
}

// DOM Element Mock
class ElementMock {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.classList = new ClassListMock();
        this.style = {};
        this.innerHTML = '';
        this.textContent = '';
        this.children = [];
        this.dataset = {};
        this.value = '';
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    querySelector(selector) {
        // Very basic mock: just return a new element or null
        return new ElementMock();
    }

    querySelectorAll(selector) {
        return [];
    }

    addEventListener(event, callback) {
        // No-op for now
    }

    remove() {
        // No-op
    }
}

// Document Mock
const documentMock = {
    elements: {},
    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = new ElementMock();
        }
        return this.elements[id];
    },
    querySelector(selector) {
        return new ElementMock();
    },
    querySelectorAll(selector) {
        return []; // Return empty node list (array)
    },
    createElement(tagName) {
        return new ElementMock(tagName);
    },
    body: new ElementMock('BODY'),
    head: new ElementMock('HEAD'),
    addEventListener: () => { }
};

// Console Spy (optional, to suppress or capture logs)
const consoleMock = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

// Setup Global Environment
module.exports = {
    setup: (globalContext) => {
        globalContext.window = globalContext;
        globalContext.document = documentMock;
        globalContext.localStorage = new LocalStorageMock();
        globalContext.console = consoleMock;
        globalContext.navigator = { vibrate: () => { } };
        globalContext.location = { reload: () => { } };
        globalContext.alert = (msg) => { console.log('[Alert]', msg); };

        // Mock UI Manager if needed, or let real one load but mock its DOM interactions
        // For now, we rely on the DOM mocks to handle UIManager's calls.
    }
};
