import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { useSlides } from './SlideContext';
import { useDisplaySettings } from './DisplaySettingsContext';
import { useEmployees } from './EmployeeContext';
import { useGraphs } from './GraphContext';

interface UnifiedPollingContextType {
    refreshAll: () => Promise<void>;
    isPolling: boolean;
}

const UnifiedPollingContext = createContext<UnifiedPollingContextType | undefined>(undefined);

export const useUnifiedPolling = () => {
    const context = useContext(UnifiedPollingContext);
    if (!context) {
        throw new Error('useUnifiedPolling must be used within a UnifiedPollingProvider');
    }
    return context;
};

interface UnifiedPollingProviderProps {
    children: React.ReactNode;
}

export const UnifiedPollingProvider: React.FC<UnifiedPollingProviderProps> = ({ children }) => {
    const { slides, setSlides } = useSlides();
    const { settings, setSettings } = useDisplaySettings();
    const { refetch: refetchEmployees } = useEmployees();
    const { refetchTeamWiseData } = useGraphs();

    const isPolling = useRef(false);
    const lastSlideSync = useRef<number>(0);
    const lastDisplaySettingsSync = useRef<number>(0);
    const lastEventStatesSync = useRef<number>(0);
    const lastEmployeeSync = useRef<number>(0);
    const lastGraphSync = useRef<number>(0);

    // Unified polling function
    const performUnifiedPoll = useCallback(async () => {
        if (isPolling.current) return;

        isPolling.current = true;
        const now = Date.now();

        try {
            // Poll slides every 30 seconds - increased from 20s
            if (now - lastSlideSync.current >= 30000) {
                console.debug('🔄 Unified Poll: Syncing slides from server');
                const serverData = await sessionService.syncFromServer();
                if (serverData?.slideData && Array.isArray(serverData.slideData)) {
                    const validSlides = serverData.slideData.filter((slide: any) =>
                        slide && slide.id && slide.type
                    );

                    if (validSlides.length > 0) {
                        // Update slides with server data, preserving local changes
                        setSlides(prevSlides => {
                            const updatedSlides = prevSlides.map(localSlide => {
                                const serverSlide = validSlides.find((s: any) => s.id === localSlide.id);
                                if (serverSlide) {
                                    // Merge server data with local slide, prioritizing server for active state
                                    return {
                                        ...localSlide,
                                        active: serverSlide.active,
                                        duration: serverSlide.duration || localSlide.duration,
                                        data: {
                                            ...localSlide.data,
                                            ...serverSlide.data
                                        }
                                    };
                                }
                                return localSlide;
                            });

                            // Add any new slides from server
                            const newSlides = validSlides.filter((serverSlide: any) =>
                                !prevSlides.some(localSlide => localSlide.id === serverSlide.id)
                            );

                            return [...updatedSlides, ...newSlides];
                        });

                        console.debug('Slides synced from server:', validSlides.length, 'slides');
                    }
                }
                lastSlideSync.current = now;
            }

            // Poll display settings every 20 seconds - increased from 10s
            if (now - lastDisplaySettingsSync.current >= 20000) {
                console.debug('🔄 Unified Poll: Syncing display settings from server');
                const serverData = await sessionService.syncFromServer();
                if (serverData?.displaySettings) {
                    // Update display settings from server
                    setSettings(prevSettings => ({
                        ...prevSettings,
                        ...serverData.displaySettings
                    }));
                    console.debug('Display settings synced from server');
                }
                lastDisplaySettingsSync.current = now;
            }

            // Poll employee data every 2 hours (event data changes daily at midnight)
            if (now - lastEmployeeSync.current >= 2 * 60 * 60 * 1000) {
                console.debug('🔄 Unified Poll: Refreshing employee data');
                try {
                    await refetchEmployees();
                    lastEmployeeSync.current = now;
                } catch (error) {
                    console.error('Error refreshing employee data:', error);
                }
            }

            // Poll graph data every 5 minutes (live data that changes frequently)
            if (now - lastGraphSync.current >= 5 * 60 * 1000) {
                console.debug('🔄 Unified Poll: Refreshing graph data');
                try {
                    await refetchTeamWiseData();
                    lastGraphSync.current = now;
                } catch (error) {
                    console.error('Error refreshing graph data:', error);
                }
            }

            // Poll event slide states every 15 seconds - increased from 8s
            if (now - lastEventStatesSync.current >= 15000) {
                console.debug('🔄 Unified Poll: Syncing event slide states from server');
                const serverData = await sessionService.syncFromServer();
                if (serverData?.appSettings?.eventSlideStates) {
                    // Update event slide states from server
                    const eventStates = serverData.appSettings.eventSlideStates;

                    setSlides(prevSlides => {
                        return prevSlides.map(slide => {
                            if (slide.type === 'event-slide' && eventStates && eventStates[slide.id] !== undefined) {
                                return {
                                    ...slide,
                                    active: eventStates[slide.id]
                                };
                            }
                            return slide;
                        });
                    });

                    console.debug('Event slide states synced from server');
                }
                lastEventStatesSync.current = now;
            }

        } catch (error) {
            console.error('Unified polling error:', error);
        } finally {
            isPolling.current = false;
        }
    }, [setSlides, setSettings]);

    // Manual refresh function
    const refreshAll = useCallback(async () => {
        console.debug('🔄 Manual refresh requested');
        lastSlideSync.current = 0;
        lastDisplaySettingsSync.current = 0;
        lastEventStatesSync.current = 0;
        lastEmployeeSync.current = 0;
        lastGraphSync.current = 0;

        // Refresh all data sources
        try {
            await Promise.all([
                performUnifiedPoll(),
                refetchEmployees(),
                refetchTeamWiseData()
            ]);
        } catch (error) {
            console.error('Error during manual refresh:', error);
        }
    }, [performUnifiedPoll, refetchEmployees, refetchTeamWiseData]);

    // Start unified polling with initial delay
    useEffect(() => {
        const initialDelay = setTimeout(() => {
            performUnifiedPoll();
        }, 5000); // 5 second initial delay for faster startup

        const interval = setInterval(performUnifiedPoll, 300000); // Poll every 5 minutes for data updates only

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [performUnifiedPoll]);

    const value: UnifiedPollingContextType = {
        refreshAll,
        isPolling: isPolling.current
    };

    return (
        <UnifiedPollingContext.Provider value={value}>
            {children}
        </UnifiedPollingContext.Provider>
    );
};
