import React from 'react';
import { Car, Plane, MapPin, DollarSign, Users, Umbrella, Sun } from 'lucide-react';

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
            {/* Master Cinematic Background - Lowered Opacity for Text Visibility */}
            <div
                className="absolute inset-0 z-0 opacity-40"
                style={{
                    backgroundImage: 'url("/assets/cinematic_bg.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            ></div>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/90 z-10"></div>

            {/* Zig-Zag Path SVG */}
            <div className="absolute inset-0 z-20 opacity-60">
                <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
                    {/* Dotted Zig-Zag Line with Typing Animation */}
                    <path
                        d="M50,50 L300,200 L100,400 L500,300 L800,600 L1100,400 L1390,850"
                        fill="none"
                        stroke="#f59e0b" // Primary color
                        strokeWidth="4"
                        strokeDasharray="15,15"
                        className="animate-draw-line"
                        style={{
                            filter: 'drop-shadow(0 0 8px #f59e0b)',
                            animationDuration: '60s'
                        }}
                    />

                    {/* Start Pin (Top Left) */}
                    <image href="/assets/pin.png" x="20" y="20" height="60" width="60" className="animate-pulse" />

                    {/* End Pin (Bottom Right) */}
                    <image href="/assets/pin.png" x="1360" y="820" height="60" width="60" className="animate-pulse" />
                </svg>
            </div>

            {/* Moving Elements with Screen Blend Mode (Removes Black Background) */}

            {/* Elements removed as per user request */}
        </div>
    );
}
