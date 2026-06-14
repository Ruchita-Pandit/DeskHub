export function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      const ctx = this;
      timer = setTimeout(() => {
        fn.apply(ctx, args);
      }, delay);
    };
  }