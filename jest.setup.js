// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for ReadableStream if not available
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor(underlyingSource) {
      this._controller = null;
      this._started = false;
      
      if (underlyingSource && underlyingSource.start) {
        const controller = {
          enqueue: (chunk) => {
            this._chunks = this._chunks || [];
            this._chunks.push(chunk);
          },
          close: () => {
            this._closed = true;
          },
          error: (error) => {
            this._error = error;
          },
        };
        this._controller = controller;
        underlyingSource.start(controller);
        this._started = true;
      }
    }
    
    getReader() {
      return {
        read: async () => {
          if (this._chunks && this._chunks.length > 0) {
            return { done: false, value: this._chunks.shift() };
          }
          if (this._closed) {
            return { done: true, value: undefined };
          }
          return { done: false, value: new Uint8Array() };
        },
        cancel: () => {},
        releaseLock: () => {},
      };
    }
  };
}

// Polyfill for Headers if not available
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = {};
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value;
          });
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value;
          });
        }
      }
    }
    get(name) {
      return this._headers[name.toLowerCase()] || null;
    }
    set(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
  };
}

// Polyfill for Request if not available (needed for NextRequest)
// Use Object.defineProperty to make url read-only to match Web API
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      const url = typeof input === 'string' 
        ? input 
        : (input && typeof input === 'object' && 'url' in input ? input.url : '');
      
      // Define url as a read-only property
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true,
        configurable: false,
      });
      
      this.method = init.method || 'GET';
      this.headers = new global.Headers(init.headers);
      this.body = init.body || null;
      this.bodyUsed = false;
    }
    
    async text() {
      if (this.bodyUsed) {
        throw new TypeError('Body already read');
      }
      this.bodyUsed = true;
      return typeof this.body === 'string' ? this.body : '';
    }
    
    async json() {
      const text = await this.text();
      return JSON.parse(text);
    }
  };
}

// Polyfill for Response if not available
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new global.Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
    
    async json() {
      const text = await this.text();
      return JSON.parse(text);
    }
    
    // Static methods
    static json(data, init = {}) {
      return new global.Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
    }
    
    static text(data, init = {}) {
      return new global.Response(data, {
        ...init,
        headers: {
          'Content-Type': 'text/plain',
          ...init.headers,
        },
      });
    }
  };
}
