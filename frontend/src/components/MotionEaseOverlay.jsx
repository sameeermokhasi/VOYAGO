import React, { useEffect, useRef, useState } from 'react';
import { X, Info } from 'lucide-react';

const MotionEaseOverlay = ({ onClose }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);

    // Physics State
    const motionRef = useRef({ x: 0, y: 0 }); // Current motion offset
    const velocityRef = useRef({ x: 0, y: 0 }); // Current velocity

    // Simulation State (for Desktop)
    const isSimulatedRef = useRef(false);
    const timeRef = useRef(0);

    // Dots array
    const dotsRef = useRef([]);

    useEffect(() => {
        // Initialize specific 'peripheral' dots
        // We want more dots on the edges, fewer in the center where user reads
        const width = window.innerWidth;
        const height = window.innerHeight;
        const dots = [];

        for (let i = 0; i < 150; i++) {
            // Random position
            let x = Math.random() * width;
            let y = Math.random() * height;

            // Bias towards edges logic
            // If dot is in the center 60% of screen, throw a die to maybe move it to edge
            const centerX = width / 2;
            const centerY = height / 2;
            const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));

            // If too close to center, valid only 20% of time, else re-roll to edge
            if (distFromCenter < maxDist * 0.3 && Math.random() > 0.2) {
                if (Math.random() > 0.5) x = x < centerX ? x / 4 : width - (width - x) / 4;
                else y = y < centerY ? y / 4 : height - (height - y) / 4;
            }

            dots.push({
                x,
                y,
                size: Math.random() * 4 + 2, // 2px to 6px
                opacity: Math.random() * 0.4 + 0.1, // 0.1 to 0.5
                speedFactor: Math.random() * 0.5 + 0.5 // Parallax depth feel
            });
        }
        dotsRef.current = dots;

        // Motion Handler
        const handleMotion = (event) => {
            // Invert acceleration to move dots AGAINST the motion (Artificial Horizon concept)
            // If car accelerates (positive Y), dots should move down (positive Y visual) ?? 
            // Actually: Car accelerates Forward -> Body moves Back. Dots should move Back (Down) to match inertial frame?
            // Standard theory: Dots should move OPPOSITE to visual perception of motion to stabilize.
            // If visual world is rushing back (out window), dots should move back?
            // Actually the "Artificial Horizon" theory says dots should mimic the STABLE horizon.
            // If car turns LEFT, horizon appears to move RIGHT. 
            // We capture acceleration changes.

            if (event.accelerationIncludingGravity) {
                // Rough approximation for demo
                const accelX = event.accelerationIncludingGravity.x || 0;
                const accelY = event.accelerationIncludingGravity.y || 0;

                // Apply smoothing
                velocityRef.current.x = velocityRef.current.x * 0.9 + accelX * 0.5;
                velocityRef.current.y = velocityRef.current.y * 0.9 + accelY * 0.5;
            }
        };

        // Check if we effectively have sensors
        if (window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function') {
            // iOS requires permission, handled by UI button usually.
            // For now assume granted or non-iOS
        }

        if ('ondevicemotion' in window) {
            window.addEventListener('devicemotion', handleMotion);
        } else {
            isSimulatedRef.current = true;
        }

        // Animation Loop
        const animate = (time) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Update Motion
            if (isSimulatedRef.current) {
                // Simulate gentle car sway (Desktop Demo)
                timeRef.current += 0.02;
                velocityRef.current.x = Math.sin(timeRef.current) * 2; // Sway Left/Right
                velocityRef.current.y = Math.cos(timeRef.current * 0.7) * 4; // Accel/Brake gentle
            }

            // Move Dots
            dotsRef.current.forEach(dot => {
                // Apply velocity * depth factor
                dot.x += velocityRef.current.x * dot.speedFactor;
                dot.y += velocityRef.current.y * dot.speedFactor;

                // Wrap around screen
                if (dot.x < 0) dot.x = width;
                if (dot.x > width) dot.x = 0;
                if (dot.y < 0) dot.y = height;
                if (dot.y > height) dot.y = 0;

                // Draw
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 200, 255, ${dot.opacity})`; // Cyan/Blueish tint for calm
                ctx.fill();
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        // Resize Handler
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Init size

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('devicemotion', handleMotion);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
            />

            {/* UI Overlay (Clickable) */}
            <div className="absolute top-4 right-4 pointer-events-auto flex items-center space-x-2">
                <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono border border-white/20 flex items-center">
                    {isSimulatedRef.current ? (
                        <span className="text-yellow-400 mr-2">● SIMULATION</span>
                    ) : (
                        <span className="text-green-400 mr-2">● SENSOR ACTIVE</span>
                    )}
                    Motion Ease™
                </div>
                <button
                    onClick={onClose}
                    className="bg-black/80 hover:bg-black text-white p-2 rounded-full border border-white/20 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Info Badge */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-sm text-gray-300 px-4 py-2 rounded-lg text-xs border border-white/10 text-center">
                    Look at your phone normally. <br />These dots stabilize your peripheral vision.
                </div>
            </div>
        </div>
    );
};

export default MotionEaseOverlay;
