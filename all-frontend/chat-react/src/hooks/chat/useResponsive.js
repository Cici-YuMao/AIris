import { useState, useEffect, useCallback } from 'react';

// 断点定义 - 简化为只区分移动端和桌面端
const BREAKPOINTS = {
    mobile: 768
};

// 获取屏幕尺寸类型
const getScreenSize = () => {
    const width = window.innerWidth;
    return width < BREAKPOINTS.mobile ? 'mobile' : 'desktop';
};

// 检查是否为移动设备
const isMobile = () => window.innerWidth < BREAKPOINTS.mobile;

// 检查是否为触摸设备
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// 防抖函数
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 主要的响应式Hook
export const useResponsive = () => {
    const [screenSize, setScreenSize] = useState(getScreenSize());
    const [isTouch, setIsTouch] = useState(isTouchDevice());

    const handleResize = useCallback(
        debounce(() => {
            setScreenSize(getScreenSize());
        }, 150),
        []
    );

    useEffect(() => {
        // 初始检测
        setIsTouch(isTouchDevice());

        // 添加resize监听器
        window.addEventListener('resize', handleResize);

        // 添加orientationchange监听器（移动设备）
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [handleResize]);

    return {
        screenSize,
        isMobile: screenSize === 'mobile',
        isDesktop: screenSize === 'desktop',
        isTouch,
        breakpoints: BREAKPOINTS
    };
};

// 断点监听Hook
export const useBreakpoint = (breakpoint) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handleChange = (e) => setMatches(e.matches);

        // 设置初始值
        setMatches(mediaQuery.matches);

        // 添加监听器
        mediaQuery.addListener(handleChange);

        return () => mediaQuery.removeListener(handleChange);
    }, [breakpoint]);

    return matches;
};

// 窗口尺寸Hook
export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    const handleResize = useCallback(
        debounce(() => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 150),
        []
    );

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [handleResize]);

    return windowSize;
};

// 设备方向Hook
export const useOrientation = () => {
    const [orientation, setOrientation] = useState(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    );

    const handleOrientationChange = useCallback(
        debounce(() => {
            setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
        }, 150),
        []
    );

    useEffect(() => {
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            window.removeEventListener('resize', handleOrientationChange);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, [handleOrientationChange]);

    return {
        orientation,
        isPortrait: orientation === 'portrait',
        isLandscape: orientation === 'landscape'
    };
};

// 媒体查询Hook
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handleChange = (e) => setMatches(e.matches);

        setMatches(mediaQuery.matches);
        mediaQuery.addListener(handleChange);

        return () => mediaQuery.removeListener(handleChange);
    }, [query]);

    return matches;
};

// 首选配色方案Hook
export const usePreferredColorScheme = () => {
    const [colorScheme, setColorScheme] = useState(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setColorScheme(e.matches ? 'dark' : 'light');

        mediaQuery.addListener(handleChange);

        return () => mediaQuery.removeListener(handleChange);
    }, []);

    return colorScheme;
};

// 减少动画偏好Hook
export const usePrefersReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = (e) => setPrefersReducedMotion(e.matches);

        mediaQuery.addListener(handleChange);

        return () => mediaQuery.removeListener(handleChange);
    }, []);

    return prefersReducedMotion;
}; 