import React, {useEffect, useRef} from 'react';

const SwipeHandler = ({
                          onSwipeUp,
                          onSwipeDown,
                          onSwipeLeft,
                          onSwipeRight,
                          onLongTouch,
                          children,
                          minSwipeDistance = 50,
                          longTouchDuration = 1000,
                          maxLongTouchMovement = 20
                      }) => {
    const touchStartRef = useRef({x: 0, y: 0});
    const containerRef = useRef(null);
    const longTouchTimerRef = useRef(null);
    const longTouchTriggeredRef = useRef(false);
    
    useEffect(() => {
        const handleTouchStart = (e) => {
            e.preventDefault(); // Prevent default browser behavior
            const touch = e.touches[0];
            touchStartRef.current = {x: touch.clientX, y: touch.clientY};
            longTouchTriggeredRef.current = false;

            // Start long touch timer
            if (onLongTouch) {
                longTouchTimerRef.current = setTimeout(() => {
                    longTouchTriggeredRef.current = true;
                    onLongTouch();
                }, longTouchDuration);
            }
        };

        const handleTouchMove = (e) => {
            e.preventDefault(); // Prevent default browser behavior during the swipe

            // Check if movement exceeds threshold for long touch
            if (longTouchTimerRef.current && !longTouchTriggeredRef.current) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
                const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

                // If user moves too much, cancel long touch
                if (deltaX > maxLongTouchMovement || deltaY > maxLongTouchMovement) {
                    clearTimeout(longTouchTimerRef.current);
                    longTouchTimerRef.current = null;
                }
            }
        };

        const handleTouchEnd = (e) => {
            e.preventDefault(); // Prevent default browser behavior

            // Clear long touch timer
            if (longTouchTimerRef.current) {
                clearTimeout(longTouchTimerRef.current);
                longTouchTimerRef.current = null;
            }

            // If long touch was triggered, don't process swipe
            if (longTouchTriggeredRef.current) {
                return;
            }

            if (e.touches.length > 0) return; // Ignore if there are still touches active

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;

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

        const handleTouchCancel = (e) => {
            // Clear long touch timer if touch is cancelled
            if (longTouchTimerRef.current) {
                clearTimeout(longTouchTimerRef.current);
                longTouchTimerRef.current = null;
            }
        };

        // Add touch event listeners to the container element
        const container = containerRef.current;
        if (container) {
            container.addEventListener('touchstart', handleTouchStart, {passive: false});
            container.addEventListener('touchmove', handleTouchMove, {passive: false});
            container.addEventListener('touchend', handleTouchEnd, {passive: false});
            container.addEventListener('touchcancel', handleTouchCancel, {passive: false});
        }

        // Clean up event listeners and timers
        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
                container.removeEventListener('touchcancel', handleTouchCancel);
            }
            if (longTouchTimerRef.current) {
                clearTimeout(longTouchTimerRef.current);
            }
        };
    }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onLongTouch, longTouchDuration, maxLongTouchMovement, minSwipeDistance]);

    return <div ref={containerRef} style={{touchAction: 'none'}}>{children}</div>;
};

export default SwipeHandler;