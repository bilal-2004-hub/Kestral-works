/* Tiny logger wrapper so transports can be swapped without touching call sites. */
const stamp = () => new Date().toISOString();

module.exports = {
  info: (...args) => console.log(`[${stamp()}] INFO `, ...args),
  warn: (...args) => console.warn(`[${stamp()}] WARN `, ...args),
  error: (...args) => console.error(`[${stamp()}] ERROR`, ...args),
};
