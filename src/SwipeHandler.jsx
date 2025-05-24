import React, {useEffect, useRef} from 'react';

const SwipeHandler = ({
                          onSwipeUp,
                          onSwipeDown,
                          onSwipeLeft,
                          onSwipeRight,
                          onDoubleTap,
                          children,
                          minSwipeDistance = 50,
                          doubleTapDelay = 300,
                          maxTapDistance = 10
                      }) => {
    const touchStartRef = useRef({x: 0, y: 0});
    const containerRef = useRef(null);
    const lastTapRef = useRef(0);
    const tapTimeoutRef = useRef(null);

    useEffect(() => {
        const handleTouchStart = (e) => {
            e.preventDefault(); // Prevent default browser behavior
            const touch = e.touches[0];
            touchStartRef.current = {x: touch.clientX, y: touch.clientY};
        };

        const handleTouchMove = (e) => {
            e.preventDefault(); // Prevent default browser behavior during the swipe
        };

        const handleTouchEnd = (e) => {
            e.preventDefault(); // Prevent default browser behavior
            if (e.touches.length > 0) return; // Ignore if there are still touches active

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Check if this was a tap (minimal movement)
            if (distance <= maxTapDistance) {
                const currentTime = Date.now();
                const timeSinceLastTap = currentTime - lastTapRef.current;

                if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
                    // Double tap detected
                    if (tapTimeoutRef.current) {
                        clearTimeout(tapTimeoutRef.current);
                        tapTimeoutRef.current = null;
                    }
                    onDoubleTap && onDoubleTap();
                    lastTapRef.current = 0; // Reset to prevent triple tap
                } else {
                    // Single tap - wait to see if there's a second tap
                    lastTapRef.current = currentTime;

                    // Clear any existing timeout
                    if (tapTimeoutRef.current) {
                        clearTimeout(tapTimeoutRef.current);
                    }

                    // Set timeout to handle single tap if no second tap comes
                    tapTimeoutRef.current = setTimeout(() => {
                        // Single tap logic could go here if needed
                        tapTimeoutRef.current = null;
                    }, doubleTapDelay);
                }
                return; // Exit early for taps
            }

            // Handle swipes (only if movement was significant)
            // Determine if the swipe was horizontal or vertical
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) >= minSwipeDistance) {
                    if (deltaX > 0) {
                        onSwipeRight && onSwipeRight();
                    } else {
                        onSwipeLeft && onSwipeLeft();
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) >= minSwipeDistance) {
                    if (deltaY > 0) {
                        onSwipeDown && onSwipeDown();
                    } else {
                        onSwipeUp && onSwipeUp();
                    }
                }
            }
        };

        // Add touch event listeners to the container element
        const container = containerRef.current;
        if (container) {
            container.addEventListener('touchstart', handleTouchStart, {passive: false});
            container.addEventListener('touchmove', handleTouchMove, {passive: false});
            container.addEventListener('touchend', handleTouchEnd, {passive: false});
        }

        // Clean up event listeners and timeouts
        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            }
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }
        };
    }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onDoubleTap, maxTapDistance, doubleTapDelay, minSwipeDistance]);

    return <div ref={containerRef} style={{touchAction: 'none'}}>{children}</div>;
};

export default SwipeHandler;