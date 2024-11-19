import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://ev-taxi-backend-7e73753d6355.herokuapp.com';

const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ['polling', 'websocket'],  // Start with polling, then upgrade to websocket if possible
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  forceNew: true,
  path: '/socket.io/',
  extraHeaders: {
    'Access-Control-Allow-Origin': '*'
  }
});

let retryCount = 0;
const maxRetries = 3;
let isConnected = false;

// Connection handling
socket.on('connect', () => {
  console.log('Connected to server');
  console.log('Transport:', socket.io.engine.transport.name);
  isConnected = true;
  retryCount = 0;
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
  isConnected = false;
});

// Enhanced error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  retryCount++;
  
  if (retryCount <= maxRetries) {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    
    setTimeout(() => {
      console.log(`Retrying connection... Attempt ${retryCount}`);
      // Force polling on retry
      socket.io.opts.transports = ['polling'];
      socket.connect();
    }, delay);
  }
});

// Transport upgrade handling
socket.io.engine.on('upgrade', () => {
  console.log('Transport upgraded to:', socket.io.engine.transport.name);
});

socket.io.engine.on('upgradeError', (err) => {
  console.log('Transport upgrade failed:', err);
});

// General error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Reconnection handling
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}`);
  // Always use polling for reconnection attempts
  socket.io.opts.transports = ['polling'];
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

// Custom emit function with timeout and error handling
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

// Force reconnection function
const forceReconnect = () => {
  if (socket) {
    socket.disconnect();
    retryCount = 0;
    socket.io.opts.transports = ['polling'];
    setTimeout(() => {
      socket.connect();
    }, 1000);
  }
};

// Helper function to check connection status
const getConnectionStatus = () => ({
  isConnected,
  transport: socket.io?.engine?.transport?.name,
  retryCount
});

// Ping/Pong monitoring
socket.io.on('ping', () => {
  console.log('Ping sent');
});

socket.io.on('pong', (latency) => {
  console.log('Pong received. Latency:', latency, 'ms');
});

// Handle browser going offline/online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser is online');
    if (!isConnected) {
      forceReconnect();
    }
  });

  window.addEventListener('offline', () => {
    console.log('Browser is offline');
    isConnected = false;
  });
}

// Export socket instance and helper functions
export { 
  socket as default, 
  getConnectionStatus, 
  emitWithTimeout, 
  forceReconnect 
};