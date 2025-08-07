import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie, faUsers } from "@fortawesome/free-solid-svg-icons";
import { EventSlide as EventSlideType, Employee } from "../../types";
import { useEmployees } from "../../contexts/EmployeeContext";

/**
 * Custom hook to get window size for responsive design
 */
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
 * Birthday/Anniversary Slide Component with responsive scaling
 */
const BirthdayAnniversarySlide: React.FC<{ employees: Employee[]; eventType?: "birthday" | "anniversary" }> = ({ employees, eventType }) => {
    const { width, height } = useWindowSize();
    const today = new Date();
    if (employees.length === 0) return null;

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Confetti for celebrations */}
            <ReactConfetti
                width={width}
                height={height}
                recycle={true}
                numberOfPieces={200}
                gravity={0.1}
                colors={['#15CC93', '#134D67', '#8CE6C9', '#FFD700', '#FF69B4', '#00FFFF']}
            />

            {/* Main Content */}
            <div className="relative z-10 text-center text-white display-padding">
                {/* Event Type Icon */}
                <div className="mb-4 sm:mb-6 md:mb-8">
                    <FontAwesomeIcon
                        icon={eventType === "anniversary" ? faUserTie : faUsers}
                        className="display-text-2xl text-emerald-400 drop-shadow-lg"
                        style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}
                    />
                </div>

                {/* Event Title */}
                <h1 className="display-text-3xl font-bold mb-2 sm:mb-4 md:mb-6 text-shadow-lg text-white">
                    {eventType === "anniversary" ? "Work Anniversary" : "Birthday"} Celebrations
                </h1>

                {/* Subtitle */}
                <p className="display-text-large mb-6 sm:mb-8 md:mb-10 text-blue-100">
                    {eventType === "anniversary"
                        ? "Congratulations on your work milestone!"
                        : "Happy Birthday to our amazing team members!"
                    }
                </p>

                {/* Employees Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
                    {employees.map((employee, index) => (
                        <motion.div
                            key={employee.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="bg-slate-800/80 backdrop-blur-md rounded-lg display-padding text-center hover:bg-slate-700/80 transition-all duration-300 shadow-lg border border-slate-600"
                        >
                            {/* Employee Photo */}
                            <div className="mb-3 sm:mb-4">
                                <div className="display-image mx-auto rounded-full overflow-hidden border-4 border-emerald-600 shadow-lg">
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
                                </div>
                            </div>

                            {/* Employee Name */}
                            <h3 className="display-text font-semibold mb-1 sm:mb-2 text-white">
                                {employee.name}
                            </h3>

                            {/* Employee Details */}
                            <p className="display-text text-blue-200 mb-2">
                                {employee.designation || "Team Member"}
                            </p>

                            {/* Celebration Details */}
                            <div className="display-text text-emerald-400 font-medium">
                                {eventType === "anniversary"
                                    ? `${today.getFullYear() - new Date(employee.dateOfJoining).getFullYear()} Year${(today.getFullYear() - new Date(employee.dateOfJoining).getFullYear()) > 1 ? 's' : ''}`
                                    : `${today.getFullYear() - new Date(employee.dob).getFullYear()} Years`
                                }
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Message */}
                <div className="mt-6 sm:mt-8 md:mt-10">
                    <p className="display-text text-blue-100 italic">
                        Thank you for your dedication and contribution to our team!
                    </p>
                </div>
            </div>
        </div>
    );
};

/**
 * EventSlide Component - Main component for birthday and anniversary slides
 */
export const EventSlide: React.FC<{ slide: EventSlideType }> = ({ slide }) => {
    const { employees, loading, error } = useEmployees();
    const eventType = slide.data.eventType;

    if (loading) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center relative overflow-hidden">
                <div className="text-center text-white relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                    <p className="display-text">Loading celebrations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center relative overflow-hidden">
                <div className="text-center text-white relative z-10">
                    <p className="display-text-large mb-2">Unable to load celebrations</p>
                    <p className="display-text">Please try again later</p>
                </div>
            </div>
        );
    }

    // Filter employees based on eventType
    const filteredEmployees = eventType === "anniversary"
        ? employees.filter(e => e.isAnniversary)
        : employees.filter(e => e.isBirthday);

    if (filteredEmployees.length === 0) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="text-center text-white relative z-10">
                    <p className="display-text-large mb-2">
                        No {eventType === "anniversary" ? "Anniversaries" : "Birthdays"} Today
                    </p>
                    <p className="display-text">Check back tomorrow for celebrations!</p>
                </div>
            </div>
        );
    }

    return <BirthdayAnniversarySlide employees={filteredEmployees} eventType={eventType} />;
}; 