import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://ev-taxi-backend-7e73753d6355.herokuapp.com';

const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  forceNew: true,
  path: '/socket.io/',
  extraHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
});

let retryCount = 0;
const maxRetries = 5;
let isConnected = false;

// Connection handling
socket.on('connect', () => {
  console.log('Connected to server');
  isConnected = true;
  retryCount = 0;
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
  isConnected = false;
});

// Error handling with fallback logic
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  retryCount++;
  
  if (retryCount <= maxRetries) {
    // Try to reconnect with polling if WebSocket fails
    if (socket.io.opts.transports.includes('websocket')) {
      console.log('Falling back to polling');
      socket.io.opts.transports = ['polling'];
    }
    
    // Exponential backoff for reconnection
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    setTimeout(() => {
      console.log(`Retrying connection... Attempt ${retryCount}`);
      socket.connect();
    }, delay);
  } else {
    console.error('Maximum retry attempts reached');
  }
});

// General error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Ping timeout handling
socket.on('ping_timeout', () => {
  console.log('Ping timeout - attempting to reconnect');
  socket.connect();
});

// Reconnect attempts handling
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}`);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
  isConnected = true;
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
});

// Helper functions
const isSocketConnected = () => isConnected;

const forceReconnect = () => {
  if (socket) {
    socket.disconnect();
    retryCount = 0;
    setTimeout(() => {
      socket.connect();
    }, 1000);
  }
};

// Custom emit function with error handling
const emitWithTimeout = (eventName, data, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (!isConnected) {
      reject(new Error('Socket is not connected'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeout);

    socket.emit(eventName, data, (response) => {
      clearTimeout(timer);
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
};

// Export socket and helper functions
export { socket as default, isSocketConnected, forceReconnect, emitWithTimeout };