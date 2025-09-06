/**
 * Helper functions for managing scroll position restoration
 */

/**
 * Restores scroll position from sessionStorage
 * @param {string} storageKey - The key used to store the scroll position in sessionStorage
 * @param {number[]} delays - Array of delay times in milliseconds to attempt restoration
 */
export const restoreScrollPosition = (storageKey, delays = [100, 300, 500]) => {
    if (typeof window === 'undefined') return;

    const savedPosition = sessionStorage.getItem(storageKey);
    if (!savedPosition) return;

    const position = parseInt(savedPosition, 10);
    if (isNaN(position)) {
        sessionStorage.removeItem(storageKey);
        return;
    }


    const scrollToPosition = () => {
        window.scrollTo({
            top: position,
            behavior: 'auto'
        });
    };

    // Try multiple times to ensure content is loaded
    delays.forEach(delay => {
        setTimeout(scrollToPosition, delay);
    });

    // Clean up after attempting restoration
    setTimeout(() => {
        sessionStorage.removeItem(storageKey);
    }, Math.max(...delays) + 100);
};

/**
 * Saves current scroll position to sessionStorage
 * @param {string} storageKey - The key to use for storing the scroll position
 */
export const saveScrollPosition = (storageKey) => {
    if (typeof window === 'undefined') return;

    const position = window.scrollY || window.pageYOffset;
    sessionStorage.setItem(storageKey, position.toString());
};
