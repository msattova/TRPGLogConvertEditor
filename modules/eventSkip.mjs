export const throttle = (fn, interval) => {
  let time = Date.now() - interval;
  return () => {
    if ((time + interval) < Date.now()) {
      time = Date.now();
      fn();
    }
  };
};

export const debounce = (fn, delay) => {
  let inDebounce;
  return () => {
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => fn.apply(), delay);
  };
};
