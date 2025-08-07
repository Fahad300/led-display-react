import React, { useEffect, useState } from "react";

/**
 * DigitalClock component - iPhone lock screen inspired digital clock.
 * Shows hours, minutes, AM/PM, and the date in a modern, minimal style.
 * Fully responsive for LED displays with dynamic scaling.
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
        <div className="flex flex-col items-center justify-center select-none backdrop-blur-md p-2 sm:p-3 md:p-4 rounded-lg shadow-lg">
            <div className="flex items-end gap-1 sm:gap-2">
                <span
                    className="font-extralight tracking-tight text-white drop-shadow-lg"
                    style={{
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                        lineHeight: '1'
                    }}
                >
                    {time.hours}
                </span>
                <span
                    className="font-extralight tracking-tight text-white drop-shadow-lg"
                    style={{
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                        lineHeight: '1'
                    }}
                >
                    :
                </span>
                <span
                    className="font-extralight tracking-tight text-white drop-shadow-lg"
                    style={{
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                        lineHeight: '1'
                    }}
                >
                    {time.minutes}
                </span>
                <span
                    className="ml-1 sm:ml-2 font-light text-emerald-300 mb-0 sm:mb-1"
                    style={{
                        fontSize: 'clamp(0.75rem, 2vw, 1.125rem)',
                        lineHeight: '1'
                    }}
                >
                    {time.isPM ? "PM" : "AM"}
                </span>
            </div>
            <div
                className="mt-1 font-light text-blue-200 tracking-wide"
                style={{
                    fontSize: 'clamp(0.625rem, 1.5vw, 1rem)',
                    lineHeight: '1.2'
                }}
            >
                {getDateString(time.date)}
            </div>
        </div>
    );
};

export default DigitalClock; 