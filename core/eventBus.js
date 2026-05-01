// core/eventBus.js
// Mục đích: EventEmitter trung tâm kết nối toàn bộ modules
// Mọi module import eventBus này để emit/on events

import { EventEmitter } from "node:events";
const eventBus = new EventEmitter();
eventBus.setMaxListeners(20);
export default eventBus;
