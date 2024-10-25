import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://ev-taxi-backend-7e73753d6355.herokuapp.com';

const socket = io(BACKEND_URL, {
  withCredentials: false,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  path: '/socket.io/',
  secure: true
});

let retryCount = 0;
const maxRetries = 3;

socket.on('connect', () => {
  console.log('Connected to server');
  retryCount = 0;
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  retryCount++;
  
  if (retryCount <= maxRetries) {
    if (socket.io.opts.transports.includes('websocket')) {
      console.log('Falling back to polling');
      socket.io.opts.transports = ['polling'];
    }
    setTimeout(() => {
      console.log(`Retrying connection... Attempt ${retryCount}`);
      socket.connect();
    }, 2000 * retryCount);
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

export default socket;