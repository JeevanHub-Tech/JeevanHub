// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

if (typeof window.matchMedia !== 'function') {
	window.matchMedia = (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	});
}

const localStorageMock = (() => {
	let store = {};
	return {
		getItem: (key) => store[key] || null,
		setItem: (key, value) => {
			store[key] = String(value);
		},
		removeItem: (key) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

class IntersectionObserverMock {
	constructor(callback, options) {
		this.callback = callback;
		this.options = options;
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
	writable: true,
	configurable: true,
	value: IntersectionObserverMock,
});
Object.defineProperty(globalThis, 'IntersectionObserver', {
	writable: true,
	configurable: true,
	value: IntersectionObserverMock,
});

class ResizeObserverMock {
	constructor(callback) {
		this.callback = callback;
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	configurable: true,
	value: ResizeObserverMock,
});
Object.defineProperty(globalThis, 'ResizeObserver', {
	writable: true,
	configurable: true,
	value: ResizeObserverMock,
});


