import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";

interface ImageModalProps {
    isOpen: boolean;
    imageUrl: string | null;
    onClose: () => void;
    altText?: string;
}

const ImageModal = ({ isOpen, imageUrl, onClose, altText = "Full screen image" }: ImageModalProps) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
    const [initialZoom, setInitialZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 5;
    const ZOOM_STEP = 0.5;

    // Reset zoom and position when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle ESC key press and wheel zoom with passive: false
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            const newZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM);
            setZoom(newZoom);
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";

            // Add wheel listener with passive: false to allow preventDefault
            const container = containerRef.current;
            if (container) {
                container.addEventListener("wheel", handleWheel, { passive: false });
            }
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";

            const container = containerRef.current;
            if (container) {
                container.removeEventListener("wheel", handleWheel);
            }
        };
    }, [isOpen, onClose, zoom]);

    // Calculate distance between two touch points
    const getTouchDistance = (touches: TouchList) => {
        const touch1 = touches[0];
        const touch2 = touches[1];
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Handle touch start for pinch-to-zoom
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch gesture starting
            const distance = getTouchDistance(e.touches);
            setInitialPinchDistance(distance);
            setInitialZoom(zoom);
        } else if (e.touches.length === 1 && zoom > 1) {
            // Single touch drag when zoomed
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y,
            });
        }
    };

    // Handle touch move for pinch-to-zoom and drag
    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && initialPinchDistance !== null) {
            // Pinch gesture zooming
            e.preventDefault(); // Prevent page scroll during pinch
            const currentDistance = getTouchDistance(e.touches);
            const scale = currentDistance / initialPinchDistance;
            const newZoom = Math.min(Math.max(initialZoom * scale, MIN_ZOOM), MAX_ZOOM);
            setZoom(newZoom);
        } else if (e.touches.length === 1 && isDragging && zoom > 1) {
            // Single touch dragging when zoomed
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
            });
        }
    };

    // Handle touch end
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.touches.length < 2) {
            setInitialPinchDistance(null);
        }
        if (e.touches.length === 0) {
            setIsDragging(false);
        }
    };

    // Handle dragging when zoomed (mouse)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (!isOpen || !imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close Button Only */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                aria-label="Close image viewer"
            >
                <X size={24} className="text-white" />
            </button>

            {/* Image Container */}
            <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
            >
                <img
                    src={imageUrl}
                    alt={altText}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                    style={{
                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    }}
                    draggable={false}
                />
            </div>
        </div>
    );
};

export default ImageModal;
