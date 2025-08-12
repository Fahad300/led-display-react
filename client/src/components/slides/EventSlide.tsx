import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie, faUsers } from "@fortawesome/free-solid-svg-icons";
import { EventSlide as EventSlideType, Employee } from "../../types";
import { useEmployees } from "../../contexts/EmployeeContext";

const wishMessages = [
    "Wishing you a fantastic year ahead!",
    "Hope all your dreams come true!",
];

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
 * Grid layout for multiple employees
 */
const MultipleEmployeesGrid: React.FC<{ employees: Employee[]; eventType?: "birthday" | "anniversary" }> = ({ employees, eventType }) => {
    const { width, height } = useWindowSize();
    const today = new Date();

    // Calculate grid layout based on employee count
    const getGridConfig = (count: number) => {
        if (count <= 5) return { cols: 5, rows: 1 };
        if (count <= 10) return { cols: 5, rows: 2 };
        if (count <= 15) return { cols: 5, rows: 3 };
        if (count <= 20) return { cols: 5, rows: 4 };
        return { cols: 5, rows: Math.ceil(count / 5) };
    };

    const { cols, rows } = getGridConfig(employees.length);
    const isBirthday = eventType !== "anniversary";

    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden animated-gradient-bg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            tabIndex={0}
            aria-label={`${isBirthday ? "Birthday" : "Anniversary"} celebrations for ${employees.length} employees`}
            role="region"
        >
            <ReactConfetti width={width} height={height} numberOfPieces={120} recycle opacity={0.7} />

            {/* Header */}
            <motion.h2
                className="font-bold text-white mb-6 md:mb-8 font-cursive text-[clamp(2rem,5vw,4rem)] leading-tight text-center"
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
            >
                {isBirthday ? "Birthday Celebrations!" : "Work Anniversary Celebrations!"}
            </motion.h2>

            {/* Employee Grid */}
            <motion.div
                className="grid gap-3 md:gap-4 mb-4 md:mb-6"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    maxWidth: "98vw",
                    maxHeight: "70vh"
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                {employees.map((employee, index) => {
                    const isAnniversary = eventType === "anniversary";
                    const years = isAnniversary ? today.getFullYear() - new Date(employee.dateOfJoining).getFullYear() : null;

                    return (
                        <motion.div
                            key={employee.id}
                            className="flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-emerald-500/50"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                delay: 0.8 + (index * 0.1),
                                type: "spring",
                                stiffness: 200,
                                damping: 15
                            }}
                            whileHover={{ scale: 1.05 }}
                            tabIndex={0}
                            aria-label={`${isBirthday ? "Birthday" : "Anniversary"} for ${employee.name}`}
                        >
                            {/* Employee Photo */}
                            <motion.div
                                className="rounded-full border-2 border-emerald-400 overflow-hidden mb-3 shadow-lg"
                                style={{
                                    width: "clamp(70px, 10vw, 140px)",
                                    height: "clamp(70px, 10vw, 140px)"
                                }}
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1 + (index * 0.1) }}
                            >
                                <img
                                    src={employee.picture ? employee.picture : employee.gender?.toLowerCase() === "male" ? "/images/male-default.jpg" : employee.gender?.toLowerCase() === "female" ? "/images/female-default.jpg" : "/images/logo-persivia.svg"}
                                    alt={employee.name}
                                    className="w-full h-full object-cover"
                                    onError={e => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = "/images/logo-persivia.svg";
                                    }}
                                />
                            </motion.div>

                            {/* Employee Name */}
                            <motion.div
                                className="text-center mb-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 + (index * 0.1) }}
                            >
                                <span className="text-white font-semibold text-[clamp(0.9rem,1.8vw,1.3rem)] leading-tight">
                                    {employee.name}
                                </span>
                            </motion.div>

                            {/* Employee Details */}
                            <motion.div
                                className="text-center text-xs md:text-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.4 + (index * 0.1) }}
                            >
                                <div className="text-emerald-300 mb-1">
                                    <FontAwesomeIcon icon={faUserTie} className="mr-1" />
                                    {employee.designation}
                                </div>
                                <div className="text-blue-300">
                                    <FontAwesomeIcon icon={faUsers} className="mr-1" />
                                    {employee.teamName}
                                </div>
                            </motion.div>

                            {/* Anniversary Years or Birthday Message */}
                            {isAnniversary && years !== null && (
                                <motion.div
                                    className="mt-2 text-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.6 + (index * 0.1) }}
                                >
                                    <span className="bg-emerald-600 text-white px-3 py-2 rounded-full text-sm md:text-base font-semibold">
                                        {years} year{years !== 1 ? "s" : ""}!
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Bottom Message */}
            <motion.div
                className="absolute bottom-6 left-0 right-0 flex justify-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
            >
                <span className="bg-slate-700 text-white px-4 md:px-8 py-2 md:py-3 rounded-full text-[clamp(0.9rem,1.5vw,1.3rem)] font-medium shadow text-center">
                    {isBirthday
                        ? "Wishing everyone a fantastic day ahead!"
                        : "Congratulations to all our amazing team members!"
                    }
                </span>
            </motion.div>
        </motion.div>
    );
};

/**
 * Single employee display (existing logic for when there's only 1 employee)
 */
const SingleEmployeeDisplay: React.FC<{ employee: Employee; eventType?: "birthday" | "anniversary" }> = ({ employee, eventType }) => {
    const { width, height } = useWindowSize();
    const today = new Date();
    const isAnniversary = eventType === "anniversary";
    const years = isAnniversary ? today.getFullYear() - new Date(employee.dateOfJoining).getFullYear() : null;
    const wish = wishMessages[Math.floor(Math.random() * wishMessages.length)];

    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden animated-gradient-bg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            tabIndex={0}
            aria-label={`${isAnniversary ? "Anniversary" : "Birthday"} slide for ${employee.name}`}
            role="region"
        >
            <ReactConfetti width={width} height={height} numberOfPieces={120} recycle opacity={0.7} />

            <motion.h2
                className="font-bold text-white mb-4 md:mb-8 font-cursive text-[clamp(2.5rem,7vw,5rem)] leading-tight text-center"
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
            >
                {isAnniversary ? "Happy Work Anniversary!" : "Happy Birthday!"}
            </motion.h2>

            <motion.div
                className="rounded-full border-4 border-emerald-600 overflow-hidden mb-4 md:mb-6 shadow-lg"
                style={{ width: "clamp(120px, 22vw, 320px)", height: "clamp(120px, 22vw, 320px)" }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.5 }}
                whileHover={{ scale: 1.15 }}
            >
                <img
                    src={employee.picture ? employee.picture : employee.gender?.toLowerCase() === "male" ? "/images/male-default.jpg" : employee.gender?.toLowerCase() === "female" ? "/images/female-default.jpg" : "/images/logo-persivia.svg"}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/images/logo-persivia.svg";
                    }}
                    tabIndex={0}
                    aria-label={`Photo of ${employee.name}`}
                />
            </motion.div>

            <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div className="bg-slate-800 px-6 md:px-12 py-2 md:py-3 rounded-full mb-2 shadow">
                    <span className="text-white font-semibold text-[clamp(1.2rem,3vw,2.5rem)]">{employee.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`font-semibold text-[clamp(1.5rem,1vw,2.5rem)] ${isAnniversary ? "text-white" : "text-emerald-400"}`}>
                        <span className="mr-2">
                            <FontAwesomeIcon icon={faUserTie} />
                        </span>
                        {employee.designation}
                    </div>
                    <div className={`font-semibold text-[clamp(1.5rem,1vw,2.5rem)] ml-5 ${isAnniversary ? "text-white" : "text-blue-300"}`}>
                        <span className="mr-2">
                            <FontAwesomeIcon icon={faUsers} />
                        </span>
                        {employee.teamName}
                    </div>
                </div>
            </motion.div>

            <motion.div
                className={`absolute ${isAnniversary ? "bottom-4" : "bottom-16 md:bottom-10"} left-0 right-0 flex justify-center`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
            >
                <span className="bg-slate-700 text-white px-4 md:px-8 py-2 md:py-3 rounded-full text-[clamp(1rem,2vw,1.5rem)] font-medium shadow text-center">
                    {isAnniversary
                        ? `Congratulations on ${years} year${years !== 1 ? "s" : ""} with us!`
                        : wish
                    }
                </span>
            </motion.div>
        </motion.div>
    );
};

/**
 * Main Birthday/Anniversary Slide Component
 */
const BirthdayAnniversarySlide: React.FC<{ employees: Employee[]; eventType?: "birthday" | "anniversary" }> = ({ employees, eventType }) => {
    if (employees.length === 0) return null;

    // Use grid layout for multiple employees, single layout for one employee
    if (employees.length === 1) {
        return <SingleEmployeeDisplay employee={employees[0]} eventType={eventType} />;
    }

    return <MultipleEmployeesGrid employees={employees} eventType={eventType} />;
};

export const EventSlide: React.FC<{ slide: EventSlideType }> = ({ slide }) => {
    const { employees, loading, error } = useEmployees();
    const eventType = slide.data.eventType;

    if (loading) {
        return <div className="flex items-center justify-center h-full w-full text-emerald-400 text-xl font-semibold">Loading {eventType === "anniversary" ? "anniversaries" : "birthdays"}...</div>;
    }
    if (error) {
        return <div className="flex items-center justify-center h-full w-full text-red-600 text-xl font-semibold">{error}</div>;
    }

    // Filter employees based on eventType
    const filteredEmployees = eventType === "anniversary"
        ? employees.filter(e => e.isAnniversary)
        : employees.filter(e => e.isBirthday);

    if (filteredEmployees.length === 0) {
        return (
            <div className="flex items-center justify-center h-full w-full text-emerald-400 text-xl font-semibold">
                No {eventType === "anniversary" ? "anniversaries" : "birthdays"} today
            </div>
        );
    }

    return <BirthdayAnniversarySlide employees={filteredEmployees} eventType={eventType} />;
}; 