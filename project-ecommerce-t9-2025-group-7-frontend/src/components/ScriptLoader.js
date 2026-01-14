import { useEffect } from 'react';

export default function ScriptLoader() {
  useEffect(() => {
    let cancelled = false;
    const intervals = [];
    const timeouts = [];

    const loadScript = (src, { force = false, check } = {}) => {
      return new Promise((resolve) => {
        if (cancelled) {
          resolve(false);
          return;
        }
        if (!force && check && check()) {
          resolve(true);
          return;
        }
        if (!force) {
          const existing = Array.from(document.getElementsByTagName('script')).find((script) => script.src && script.src.includes(src));
          if (existing && (!check || check())) {
            resolve(true);
            return;
          }
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.setAttribute('data-react-script', `${src}-${Date.now()}`);
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const initTimer = () => {
      const clockElement = document.getElementById('clockdiv-1');
      if (clockElement && typeof window.initializeClock === 'function') {
        const deadline = new Date(Date.parse(new Date()) + 15 * 24 * 60 * 60 * 1000);
        window.initializeClock('clockdiv-1', deadline);
        return true;
      }
      return false;
    };

    const initThemeSettings = () => {
      let initialized = false;
      if (typeof window.initColorPicker === 'function') {
        window.initColorPicker();
        initialized = true;
      }
      if (typeof window.initDarkSetting === 'function') {
        window.initDarkSetting();
        initialized = true;
      }
      if (typeof window.initRTLSetting === 'function') {
        window.initRTLSetting();
        initialized = true;
      }
      return initialized;
    };

    const initSlick = () => {
      if (typeof window.$ === 'undefined' || typeof window.$().slick !== 'function') {
        return false;
      }
      const slickSelectors = [
        '.category-slider',
        '.category-slider-2',
        '.banner-slider',
        '.product-box-slider',
        '.best-selling-slider',
        '.slider-3-blog',
        '.category-panel-slider',
        '.featured-slider',
        '.product-border',
        '.slider-animate'
      ];
      let initialized = false;
      slickSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((element) => {
            if (!window.$(element).hasClass('slick-initialized')) {
              try {
                if (selector === '.slider-animate') {
                  window.$(element).slick({
                    autoplay: true,
                    speed: 1800,
                    lazyLoad: 'progressive',
                    fade: true,
                    dots: true
                  });
                  if (typeof window.$().slickAnimation === 'function') {
                    window.$(element).slickAnimation();
                  }
                } else if (selector === '.category-slider') {
                  window.$(element).slick({
                    arrows: true,
                    infinite: true,
                    slidesToShow: 8,
                    slidesToScroll: 1,
                    responsive: [
                      { breakpoint: 1745, settings: { slidesToShow: 7 } },
                      { breakpoint: 1399, settings: { slidesToShow: 6 } },
                      { breakpoint: 1124, settings: { slidesToShow: 5 } },
                      { breakpoint: 900, settings: { slidesToShow: 4 } },
                      { breakpoint: 692, settings: { slidesToShow: 3 } },
                      { breakpoint: 482, settings: { slidesToShow: 2 } }
                    ]
                  });
                } else if (selector === '.banner-slider') {
                  window.$(element).slick({
                    arrows: false,
                    infinite: true,
                    slidesToShow: 4,
                    slidesToScroll: 1,
                    autoplay: true,
                    autoplaySpeed: 2500,
                    dots: false,
                    responsive: [
                      { breakpoint: 1387, settings: { slidesToShow: 3 } },
                      { breakpoint: 966, settings: { slidesToShow: 2 } },
                      { breakpoint: 600, settings: { slidesToShow: 1, fade: true } }
                    ]
                  });
                } else {
                  window.$(element).slick();
                }
                initialized = true;
              } catch (error) {
                console.warn(`Slick initialization error for ${selector}:`, error);
              }
            } else {
              initialized = true;
            }
          });
        }
      });
      return initialized;
    };

    const coreScripts = [
      { src: '/assets/js/jquery-3.6.0.min.js', check: () => typeof window.$ !== 'undefined' },
      { src: '/assets/js/jquery-ui.min.js', check: () => typeof window.$ !== 'undefined' && typeof window.$.ui !== 'undefined' },
      { src: '/assets/js/bootstrap/bootstrap.bundle.min.js', check: () => typeof window.bootstrap !== 'undefined' || typeof window.Popover !== 'undefined' },
      { src: '/assets/js/bootstrap/bootstrap-notify.min.js', check: () => typeof window.$ !== 'undefined' && typeof window.$.notify !== 'undefined' },
      { src: '/assets/js/bootstrap/popper.min.js', check: () => typeof window.Popover !== 'undefined' },
      { src: '/assets/js/feather/feather.min.js', check: () => typeof window.feather !== 'undefined' },
      { src: '/assets/js/feather/feather-icon.js', check: () => typeof window.feather !== 'undefined' },
      { src: '/assets/js/lazysizes.min.js', check: () => typeof window.lazySizes !== 'undefined' },
      { src: '/assets/js/slick/slick.js', check: () => typeof window.$ !== 'undefined' && typeof window.$().slick === 'function' },
      { src: '/assets/js/wow.min.js', check: () => typeof window.WOW !== 'undefined' }
    ];

    const interactiveScripts = [
      '/assets/js/slick/slick-animation.min.js',
      '/assets/js/slick/custom_slick.js',
      '/assets/js/auto-height.js',
      '/assets/js/timer1.js',
      '/assets/js/fly-cart.js',
      '/assets/js/quantity-2.js',
      '/assets/js/custom-wow.js',
      '/assets/js/script.js',
      '/assets/js/theme-setting.js'
    ];

    const ensureCoreScripts = async () => {
      for (const script of coreScripts) {
        if (cancelled) {
          return;
        }
        await loadScript(script.src, { force: false, check: script.check });
      }
    };

    const reloadInteractiveScripts = async () => {
      for (const src of interactiveScripts) {
        if (cancelled) {
          return;
        }
        await loadScript(src, { force: true });
      }
    };

    const scheduleRetry = (fn, attempts = 10, delay = 200) => {
      let tries = 0;
      const id = setInterval(() => {
        tries += 1;
        const done = fn();
        if (done || tries >= attempts || cancelled) {
          clearInterval(id);
        }
      }, delay);
      intervals.push(id);
    };

    const initializePlugins = () => {
      scheduleRetry(initTimer, 10, 200);
      scheduleRetry(() => {
        if (typeof window.$ === 'undefined') {
          return false;
        }
        return initThemeSettings();
      }, 10, 200);
      scheduleRetry(() => {
        if (typeof window.$ === 'undefined') {
          return false;
        }
        return initSlick();
      }, 15, 200);
      const featherTimeout = setTimeout(() => {
        if (typeof window.feather !== 'undefined') {
          try {
            window.feather.replace();
          } catch (error) {
            console.warn('Feather initialization error:', error);
          }
        }
        if (typeof window.WOW !== 'undefined') {
          try {
            new window.WOW().init();
          } catch (error) {
            console.warn('WOW initialization error:', error);
          }
        }
      }, 0);
      timeouts.push(featherTimeout);
    };

    const bootstrapScripts = async () => {
      await ensureCoreScripts();
      if (cancelled) {
        return;
      }
      await reloadInteractiveScripts();
      if (cancelled) {
        return;
      }
      initializePlugins();
    };

    bootstrapScripts();

    return () => {
      cancelled = true;
      intervals.forEach((id) => clearInterval(id));
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, []);

  return null;
}

