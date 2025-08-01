import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { NewsSlide } from "../types";

/**
 * Animated Characters Component for text animation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AnimatedCharacters: React.FC<{ text: string; className?: string; style?: React.CSSProperties }> = ({
    text,
    className = "",
    style = {}
}) => {
    const letters = Array.from(text);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: 0.2 * i }
        })
    };

    const childVariants = {
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200
            }
        },
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.5
        }
    };

    return (
        <motion.span
            style={{ display: "inline-block", ...style }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                    variants={childVariants}
                >
                    {letter}
                </motion.span>
            ))}
        </motion.span>
    );
};

/**
 * Enhanced Animated Title Component with color and position animations
 */
const AnimatedTitle: React.FC<{
    text: string;
    className?: string;
    baseColor: string;
}> = ({ text, className = "", baseColor }) => {
    const letters = Array.from(text);
    const colors = [
        baseColor,
        "#FFD700", // Gold
        "#FF69B4", // Hot Pink
        "#00FFFF", // Cyan
        baseColor
    ];

    const containerVariants = {
        animate: {
            transition: {
                staggerChildren: 0.1,
                repeat: Infinity,
                repeatType: "reverse" as const,
                duration: 8
            }
        }
    };

    const letterVariants = {
        animate: {
            y: [0, -20, 0, 20, 0],
            x: [0, 10, 0, -10, 0],
            color: colors,
            textShadow: [
                "0 0 20px rgba(255,255,255,0.5)",
                "0 0 60px rgba(255,255,255,0.3)",
                "0 0 20px rgba(255,255,255,0.5)"
            ],
            transition: {
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse" as const,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            className={`relative ${className}`}
            variants={containerVariants}
            animate="animate"
        >
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                    variants={letterVariants}
                >
                    {letter}
                </motion.span>
            ))}
        </motion.div>
    );
};

/**
 * Full News Slide Component with animations and effects
 */
const NewsSlideComponent: React.FC<{ slide: NewsSlide }> = ({ slide }) => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const {
        title,
        details,
        backgroundImage,
        overlayOpacity = 0.5,
        textColor = "#FFFFFF",
        textSize = "large",
        textAlignment = "center"
    } = slide.data;

    // Enhanced text size mapping for fullscreen - Balanced size
    const getTitleSize = () => {
        switch (textSize) {
            case "small": return "text-5xl md:text-6xl";
            case "medium": return "text-6xl md:text-7xl";
            case "large": return "text-7xl md:text-8xl";
            case "xl": return "text-8xl md:text-9xl";
            case "2xl": return "text-9xl md:text-[10rem]";
            default: return "text-7xl md:text-8xl";
        }
    };

    const getDetailsSize = () => {
        switch (textSize) {
            case "small": return "text-xl md:text-2xl";
            case "medium": return "text-2xl md:text-3xl";
            case "large": return "text-3xl md:text-4xl";
            case "xl": return "text-4xl md:text-5xl";
            case "2xl": return "text-5xl md:text-6xl";
            default: return "text-3xl md:text-4xl";
        }
    };

    // Enhanced animation variants with corrected easing
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.3
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.5,
                ease: "easeInOut"
            }
        }
    };

    const textContainerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                ease: "easeOut",
                staggerChildren: 0.2
            }
        }
    };

    return (
        <motion.div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* React Confetti Effect */}
            <ReactConfetti
                width={windowSize.width}
                height={windowSize.height}
                numberOfPieces={50}
                recycle={true}
                colors={["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]}
                opacity={0.7}
                gravity={0.1}
            />

            {backgroundImage && (
                <motion.div
                    className="absolute inset-0 w-full h-full"
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        transition: { duration: 1.5, ease: "easeOut" }
                    }}
                >
                    <img
                        src={backgroundImage}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.parentElement!.innerHTML = `
                                <div class="flex flex-col items-center justify-center h-full bg-base-300">
                                    <svg class="w-24 h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-gray-500 text-2xl">Failed to load image</p>
                                </div>
                            `;
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: overlayOpacity,
                            transition: { duration: 1 }
                        }}
                    />
                </motion.div>
            )}

            <motion.div
                className={`relative w-full max-w-[90%] mx-auto px-8 py-16 ${textAlignment === "left"
                    ? "text-left"
                    : textAlignment === "right"
                        ? "text-right"
                        : "text-center"
                    }`}
                variants={textContainerVariants}
            >
                <motion.div className="space-y-12">
                    <motion.div
                        className={`font-bold tracking-tight ${getTitleSize()}`}
                    >
                        <AnimatedTitle
                            text={title}
                            baseColor={textColor}
                            className="leading-tight"
                        />
                    </motion.div>

                    <motion.div
                        className={`space-y-8 ${getDetailsSize()}`}
                        style={{ color: textColor }}
                    >
                        {details.split('\n').map((paragraph, index) => (
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    transition: {
                                        delay: 1 + (index * 0.2),
                                        duration: 0.8,
                                        ease: "easeOut"
                                    }
                                }}
                                className="leading-tight"
                            >
                                {paragraph}
                            </motion.p>
                        ))}
                        {/* Show newsImage below details if present */}
                        {slide.data.newsImage && (
                            <div className="mt-8 flex justify-center">
                                <div className="relative w-48 h-48 z-0">
                                    {/* Animated conic-gradient border */}
                                    <div className="animated-conic-border"></div>
                                    {/* Inner white border for clean edge */}
                                    <div className="absolute inset-[4px] rounded-full bg-white"></div>
                                    {/* Image container */}
                                    <div className="absolute inset-[8px] rounded-full overflow-hidden">
                                        <img
                                            src={slide.data.newsImage}
                                            alt="News"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default NewsSlideComponent; 