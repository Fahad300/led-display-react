import React, { useEffect, useState } from "react";

/**
 * DigitalClock component - iPhone lock screen inspired digital clock.
 * Shows hours, minutes, AM/PM, and the date in a modern, minimal style.
 */
const pad = (num: number) => num.toString().padStart(2, "0");

const getTimeParts = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const isPM = hours >= 12;
    hours = hours % 12 || 12;
    return {
        hours: pad(hours),
        minutes: pad(minutes),
        isPM,
        date: now,
    };
};

const getDateString = (date: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${pad(date.getDate())}`;
};

export const DigitalClock: React.FC = () => {
    const [time, setTime] = useState(getTimeParts());

    useEffect(() => {
        const interval = setInterval(() => setTime(getTimeParts()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center select-none bg-white/10 backdrop-blur-md p-4 rounded-lg">
            <div className="flex items-end gap-2">
                <span className="text-[2.5rem] md:text-5xl font-extralight tracking-tight text-white drop-shadow-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {time.hours}
                </span>
                <span className="text-[2.5rem] md:text-5xl font-extralight tracking-tight text-white drop-shadow-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    :
                </span>
                <span className="text-[2.5rem] md:text-5xl font-extralight tracking-tight text-white drop-shadow-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {time.minutes}
                </span>
                <span className="ml-2 text-base md:text-lg font-light text-gray-300 mb-1">{time.isPM ? "PM" : "AM"}</span>
            </div>
            <div className="mt-1 text-xs md:text-base font-light text-gray-300 tracking-wide">
                {getDateString(time.date)}
            </div>
        </div>
    );
};

export default DigitalClock; 