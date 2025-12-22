import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingLines from '../components/FloatingLines';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <div
            className={`relative w-full h-dvh overflow-hidden bg-black transition-opacity duration-500 ${
                visible && !leaving ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div className="absolute inset-0">
                <FloatingLines
                    linesGradient={["#5b9dff","#7c4dff","#00e5ff","#00c853"]}
                    enabledWaves={["top","middle","bottom"]}
                    lineCount={[7,8,6]}
                    lineDistance={[6,5,7]}
                    animationSpeed={1.2}
                    interactive
                    bendRadius={5}
                    bendStrength={-0.6}
                    mouseDamping={0.08}
                    parallax
                    parallaxStrength={0.18}
                    mixBlendMode="screen"
                />
            </div>

            <div className="relative z-10 flex h-full items-center justify-center">
                <div className="mx-6 max-w-4xl text-center">
                    <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-md leading-relaxed">
                        <span className="block">The Next Gen Education</span>
                        <span className="block mt-3">Starts with SUDAR AI</span>
                    </h1>
                    <div className="mt-10">
                        <button
                            onClick={() => {
                                setLeaving(true);
                                setTimeout(() => navigate('/auth'), 350);
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-white/95 px-8 py-4 text-base md:text-lg font-medium text-gray-900 shadow-lg shadow-black/30 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-transform duration-300 hover:scale-105"
                        >
                            Proceed
                        </button>
                    </div>
                </div>
            </div>

            {/* subtle gradient overlay for contrast */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/50" />
        </div>
    );
};

export default Landing;