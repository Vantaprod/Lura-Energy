(function () {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  var host = window.location.hostname;
  if (
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    host.indexOf('192.168.') !== 0
  ) {
    return;
  }
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) return;
    Promise.all(
      regs.map(function (r) {
        return r.unregister();
      }),
    )
      .then(function () {
        if (!window.caches) return;
        return caches.keys().then(function (keys) {
          return Promise.all(
            keys.map(function (k) {
              return caches.delete(k);
            }),
          );
        });
      })
      .then(function () {
        var key = '__sw_nuked__';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
        }
      });
  });
})();