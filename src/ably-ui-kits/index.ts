declare global {
  var __ABLY_CHAT_REACT_UI_COMPONENTS_VERSION__: string;
}

globalThis.__ABLY_CHAT_REACT_UI_COMPONENTS_VERSION__ = '0.1.0';
// export * from './app/index.js'; // App directory doesn't exist
export * from './components/molecules/index.js';
export * from './context/index.js';
export * from './hooks/index.js';
export * from './providers/index.js';
import './style.css';
