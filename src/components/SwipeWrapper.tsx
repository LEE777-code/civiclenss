import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";

interface SwipeWrapperProps {
    children: ReactNode;
    className?: string;
    swipeDisabled?: boolean;
}

const SwipeWrapper = ({ children, className = "", swipeDisabled = false }: SwipeWrapperProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Define the order of screens
    const screens = ["/home", "/report", "/map", "/profile"];

    // Handle sub-routes (e.g., /report might match /report-details, but we only want main swipe on main tabs)
    // For simplicity, we'll check exact match or startsWith if needed, but for these 4 tabs exact match is safest for now
    // unless we want to swipe away from a form? Probably only main landing pages.
    // Let's stick to exact paths for the main navigation to avoid accidental swipes in sub-pages.

    const currentIndex = screens.indexOf(location.pathname);

    const handlers = swipeDisabled
        ? {}
        : useSwipeable({
              onSwipedLeft: () => {
                  if (currentIndex !== -1 && currentIndex < screens.length - 1) {
                      navigate(screens[currentIndex + 1]);
                  }
              },
              onSwipedRight: () => {
                  if (currentIndex !== -1 && currentIndex > 0) {
                      navigate(screens[currentIndex - 1]);
                  }
              },
              trackMouse: true,
              preventScrollOnSwipe: true,
              delta: 50, // Min swipe distance in px
          });

    // If swipe is disabled we should not spread handlers to avoid capturing touch gestures
    return (
        <div {...(swipeDisabled ? {} : handlers)} className={`min-h-screen touch-pan-y ${className}`}>
            {children}
        </div>
    );
};

export default SwipeWrapper;
