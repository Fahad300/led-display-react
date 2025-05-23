import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie, faUsers } from "@fortawesome/free-solid-svg-icons";
import { employees } from "../../data/employees";
import { EventSlide as EventSlideType } from "../../types";

const wishMessages = [
    "Wishing you a fantastic year ahead!",
    "May your day be filled with joy and laughter!",
    "Hope all your dreams come true!",
    "Have a wonderful birthday celebration!",
    "Cheers to another amazing year!"
];

// Custom useWindowSize hook
const useWindowSize = () => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
        const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return size;
};

/**
 * Birthday Slide Component
 * Displays a celebratory slide for employees with birthdays today
 */
const BirthdaySlide: React.FC<{ employees: typeof employees }> = ({ employees }) => {
    const { width, height } = useWindowSize();

    // Filter employees with birthdays today
    const today = new Date();
    const birthdayEmployees = employees.filter(employee => {
        const dob = new Date(employee.dob);
        return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
    });

    // If no birthdays today, return null
    if (birthdayEmployees.length === 0) {
        return null;
    }

    // Create slides for each birthday employee
    return (
        <>
            {birthdayEmployees.map((employee, index) => {
                const wish = wishMessages[index % wishMessages.length];
                return (
                    <motion.div
                        key={employee.id}
                        className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden animated-gradient-bg"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        {/* Confetti */}
                        <ReactConfetti width={width} height={height} numberOfPieces={120} recycle={true} opacity={0.7} />

                        {/* Animated Heading */}
                        <motion.h2
                            className="font-bold text-white mb-4 md:mb-8 font-cursive text-[clamp(2.5rem,7vw,5rem)] leading-tight text-center"
                            initial={{ y: -60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 120, delay: 0.2 }}
                        >
                            Happy Birthday!
                        </motion.h2>

                        {/* Animated Photo */}
                        <motion.div
                            className="rounded-full border-4 border-persivia-blue overflow-hidden mb-4 md:mb-6 shadow-lg"
                            style={{
                                width: "clamp(120px, 22vw, 320px)",
                                height: "clamp(120px, 22vw, 320px)"
                            }}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1.1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.5 }}
                            whileHover={{ scale: 1.15 }}
                        >
                            <img
                                src={
                                    employee.picture
                                        ? employee.picture
                                        : employee.gender === "male"
                                            ? "/images/male-default.jpg"
                                            : employee.gender === "female"
                                                ? "/images/female-default.jpg"
                                                : "/images/logo-persivia.svg"
                                }
                                alt={employee.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = "/images/logo-persivia.svg";
                                }}
                            />
                        </motion.div>

                        {/* Name and Designation/Team */}
                        <motion.div
                            className="flex flex-col items-center"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="bg-persivia-blue px-6 md:px-12 py-2 md:py-3 rounded-full mb-2 shadow">
                                <span className="text-white font-semibold text-[clamp(1.2rem,3vw,2.5rem)]">{employee.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-persivia-blue font-semibold text-[clamp(1.5rem,1vw,2.5rem)]">
                                    <span className="mr-2">
                                        <FontAwesomeIcon icon={faUserTie} />
                                    </span>
                                    {employee.designation}
                                </div>
                                <div className="text-persivia-blue font-semibold text-[clamp(1.5rem,1vw,2.5rem)] ml-5">
                                    <span className="mr-2">
                                        <FontAwesomeIcon icon={faUsers} />
                                    </span>
                                    {employee.teamName}
                                </div>
                            </div>
                        </motion.div>

                        {/* Wish Message */}
                        <motion.div
                            className="absolute bottom-16 md:bottom-10 left-0 right-0 flex justify-center"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                        >
                            <span className="bg-persivia-light-gray text-persivia-blue px-4 md:px-8 py-2 md:py-3 rounded-full text-[clamp(1rem,2vw,1.5rem)] font-medium shadow text-center">
                                {wish}
                            </span>
                        </motion.div>
                    </motion.div>
                );
            })}
        </>
    );
};

/**
 * EventSlide
 * Renders the BirthdaySlide if there are birthdays today
 */
export const EventSlide: React.FC<{ slide: EventSlideType }> = ({ slide }) => {
    // Check if there are any birthdays today
    const today = new Date();
    const hasBirthdays = employees.some(employee => {
        const dob = new Date(employee.dob);
        return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
    });

    // If no birthdays, return null to prevent rendering
    if (!hasBirthdays) {
        return null;
    }

    return <BirthdaySlide employees={employees} />;
}; 