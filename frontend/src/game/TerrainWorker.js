// Web worker stub: in a real engine, this would run noise generation off main thread.
// For simplicity in this skeleton, terrain generation is server-side.
self.onmessage = (e) => {
  // Reserved for future client-side terrain generation.
  self.postMessage({ type: 'ack', data: e.data });
};
