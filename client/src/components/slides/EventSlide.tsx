import React from "react";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase, faUsers } from "@fortawesome/free-solid-svg-icons";
import { Employee, EventSlide } from "../../types";

/**
 * Custom hook to get window dimensions
 */
const useWindowSize = () => {
    const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });

    React.useEffect(() => {
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

    // Calculate grid layout based on employee count with better sizing
    const getGridConfig = (count: number) => {
        if (count <= 4) return { cols: Math.min(count, 2), rows: Math.ceil(count / 2), cardSize: "xlarge" };
        if (count <= 10) return { cols: 5, rows: Math.ceil(count / 5), cardSize: "small" };
        return { cols: 6, rows: Math.ceil(count / 6), cardSize: "xsmall" };
    };

    const getCardDimensions = (size: string) => {
        switch (size) {
            case "xlarge":
                return {
                    width: Math.min(width * 0.5, 400),
                    height: Math.min(height * 0.5, 400),
                    photoSize: Math.min(width * 0.3, 220),
                    textSize: "1.5rem",
                    nameSize: "1.8rem"
                };
            case "small":
                return {
                    width: Math.min(width * 0.15, 120),
                    height: Math.min(height * 0.15, 120),
                    photoSize: Math.min(width * 0.1, 70),
                    textSize: "0.9rem",
                    nameSize: "1.1rem"
                };
            case "xsmall":
                return {
                    width: Math.min(width * 0.12, 100),
                    height: Math.min(height * 0.12, 100),
                    photoSize: Math.min(width * 0.08, 60),
                    textSize: "0.8rem",
                    nameSize: "1rem"
                };
            default:
                return {
                    width: Math.min(width * 0.2, 200),
                    height: Math.min(height * 0.2, 200),
                    photoSize: Math.min(width * 0.15, 120),
                    textSize: "1.2rem",
                    nameSize: "1.4rem"
                };
        }
    };

    const { cols, rows, cardSize } = getGridConfig(employees.length);
    const isBirthday = eventType !== "anniversary";
    const cardDims = getCardDimensions(cardSize);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 animated-gradient-bg">
            {/* React Confetti Effect */}
            <ReactConfetti
                width={width}
                height={height}
                numberOfPieces={50}
                recycle={true}
                colors={["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]}
                opacity={0.7}
                gravity={0.1}
            />

            <div className="text-center mb-6">
                <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-3">
                    {isBirthday ? "🎉 Happy Birthday!" : "🎊 Work Anniversary!"}
                </h2>
                <p className="text-2xl md:text-3xl text-white opacity-90">
                    {isBirthday ? "Celebrating our amazing team members" : "Celebrating years of dedication"}
                </p>
            </div>

            <div
                className="grid gap-6 items-center justify-center"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    maxWidth: "95%",
                    maxHeight: "70%"
                }}
            >
                {employees.map((employee, index) => (
                    <motion.div
                        key={employee.id}
                        className="flex flex-col items-center justify-center text-center bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-500/50"
                        style={{
                            width: cardDims.width,
                            height: cardDims.height
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="relative mb-3">
                            <img
                                src={employee.picture || (employee.gender === "female" ? "/images/female-default.jpg" : "/images/male-default.jpg")}
                                alt={employee.name}
                                className="rounded-full object-cover border-4 border-emerald-400 shadow-lg"
                                style={{
                                    width: cardDims.photoSize,
                                    height: cardDims.photoSize
                                }}
                            />
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2 shadow-lg">
                                {isBirthday ? "🎂" : "🏆"}
                            </div>
                        </div>

                        <div className="text-center">
                            <span
                                className="text-white font-semibold leading-tight block truncate"
                                style={{ fontSize: cardDims.nameSize }}
                                title={employee.name}
                            >
                                {employee.name}
                            </span>
                            <span
                                className="text-emerald-300 opacity-80 block mt-1 truncate"
                                style={{ fontSize: cardDims.textSize }}
                                title={employee.designation}
                            >
                                {employee.designation}
                            </span>
                            <span
                                className="text-white opacity-70 block mt-1 truncate"
                                style={{ fontSize: cardDims.textSize }}
                                title={employee.teamName}
                            >
                                {employee.teamName}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/**
 * Single employee display
 */
const SingleEmployeeDisplay: React.FC<{ employee: Employee; eventType?: "birthday" | "anniversary" }> = ({ employee, eventType }) => {
    const { width, height } = useWindowSize();
    const today = new Date();
    const isAnniversary = eventType === "anniversary";
    const years = isAnniversary ? today.getFullYear() - new Date(employee.dateOfJoining).getFullYear() : null;

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
            <motion.h2
                className="font-bold text-white mb-6 md:mb-8 font-cursive text-[clamp(2.5rem,7vw,5rem)] leading-tight text-center"
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
                    src={employee.picture || (employee.gender === "female" ? "/images/female-default.jpg" : "/images/male-default.jpg")}
                    alt={employee.name}
                    className="w-full h-full object-cover"
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
                <div className="text-center">
                    <div className="text-emerald-300 mb-2 text-[clamp(1.4rem,3.5vw,2.8rem)] flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faBriefcase} className="text-[clamp(1.2rem,3vw,2.4rem)]" />
                        {employee.designation}
                    </div>
                    <div className="text-blue-300 text-[clamp(1.4rem,3.5vw,2.8rem)] flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faUsers} className="text-[clamp(1.2rem,3vw,2.4rem)]" />
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
                        : "Wishing you a fantastic year ahead!"
                    }
                </span>
            </motion.div>
        </motion.div>
    );
};

/**
 * Birthday/Anniversary slide component
 */
const BirthdayAnniversarySlide: React.FC<{ employees: Employee[]; eventType?: "birthday" | "anniversary" }> = ({ employees, eventType }) => {
    if (employees.length === 1) {
        return <SingleEmployeeDisplay employee={employees[0]} eventType={eventType} />;
    }

    return <MultipleEmployeesGrid employees={employees} eventType={eventType} />;
};

/**
 * Main EventSlide component
 */
export const EventSlideComponent: React.FC<{ slide: EventSlide }> = ({ slide }) => {
    const { employees } = slide.data;
    const eventType = slide.data.eventType;

    if (!employees || employees.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center animated-gradient-bg">
                <div className="text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">No Events Today</h2>
                    <p className="text-xl opacity-80">Check back tomorrow for celebrations!</p>
                </div>
            </div>
        );
    }

    return <BirthdayAnniversarySlide employees={employees} eventType={eventType} />;
}; 