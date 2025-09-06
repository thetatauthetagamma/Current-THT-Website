import React, { useState, useEffect } from 'react';
import supabase from '@/supabase';

/**
 * RusheeAttendance Component
 * 
 * Displays a visual representation of a rushee's event attendance
 * as colored blocks (green for attended, red for missed). Includes
 * hover tooltips to show event details.
 * 
 * @param {string} uniqname - The uniqname of the rushee
 */
const RusheeAttendance = ({ uniqname }) => {
    // Event definitions for both rounds
    const EVENTS = {
        round1: [
            'Info Session - CCCB',
            'Info Session - League',
            'Resume Workshop',
            'Diversity Workshop',
            'Social Event'
        ],
        round2: [
            'Committee Highlights',
            'Natural Disaster Event',
            'Speed Dating'
        ]
    };

    const [attendanceData, setAttendanceData] = useState({
        round1: [],
        round2: []
    });
    const [loading, setLoading] = useState(true);
    const [hoveredEvent, setHoveredEvent] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!uniqname) return;

            setLoading(true);

            try {
                // Trim the uniqname to handle cases with whitespace
                const trimmedUniqname = uniqname.trim();

                const { data, error } = await supabase
                    .from('Rushee_Attendance')
                    .select('event_name, uniqname')
                    .eq('uniqname', trimmedUniqname);

                if (error) {
                    console.error('Error fetching attendance data:', error);
                    return;
                }

                // Process the attendance data into round1 and round2 arrays
                const round1Events = [];
                const round2Events = [];

                // Create a set of events the rushee has attended
                const attendedEvents = new Set();
                if (data && data.length > 0) {
                    data.forEach(record => {
                        // Trim whitespace from event_name to handle cases with extra spaces
                        if (record.event_name) {
                            attendedEvents.add(record.event_name.trim());
                        }
                    });
                }

                // Process Round 1 events
                EVENTS.round1.forEach((eventName, index) => {
                    const isAttended = attendedEvents.has(eventName.trim());
                    round1Events.push({
                        eventNumber: index + 1,
                        attended: isAttended,
                        eventName: eventName
                    });
                });

                // Process Round 2 events
                EVENTS.round2.forEach((eventName, index) => {
                    const isAttended = attendedEvents.has(eventName.trim());
                    round2Events.push({
                        eventNumber: index + 1,
                        attended: isAttended,
                        eventName: eventName
                    });
                });

                // Sort events by event_number to ensure proper order
                round1Events.sort((a, b) => a.eventNumber - b.eventNumber);
                round2Events.sort((a, b) => a.eventNumber - b.eventNumber);

                setAttendanceData({
                    round1: round1Events,
                    round2: round2Events
                });
            } catch (error) {
                console.error('Unexpected error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceData();
    }, [uniqname]);

    const handleMouseEnter = (event, e, roundName) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            top: rect.top - 40,
            left: rect.left
        });
        setHoveredEvent({ ...event, roundName });
    };

    const handleMouseLeave = () => {
        setHoveredEvent(null);
    };

    const renderAttendanceBlocks = (events, roundName) => {
        if (events.length === 0) {
            return (
                <div className="flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">{roundName}</span>
                    <div className="flex gap-1">
                        {Array.from({ length: roundName === 'Round 1' ? 5 : 3 }, (_, index) => (
                            <div
                                key={index}
                                className="w-4 h-4 bg-gray-200 rounded-sm"
                            />
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 mb-1">{roundName}</span>
                <div className="flex gap-1">
                    {events.map((event, index) => (
                        <div
                            key={index}
                            className={`w-4 h-4 rounded-sm transition-all cursor-pointer hover:opacity-80 ${event.attended ? 'bg-green-500' : 'bg-red-500'
                                }`}
                            onMouseEnter={(e) => handleMouseEnter(event, e, roundName)}
                            onMouseLeave={handleMouseLeave}
                        />
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col space-y-1 ml-2">
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="w-4 h-4 bg-gray-200 rounded-sm animate-pulse"></div>
                    ))}
                </div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-1 mt-1"></div>
                <div className="flex gap-1">
                    {Array.from({ length: 3 }, (_, index) => (
                        <div key={index} className="w-4 h-4 bg-gray-200 rounded-sm animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 relative">
            {renderAttendanceBlocks(attendanceData.round1, 'Round 1')}
            {renderAttendanceBlocks(attendanceData.round2, 'Round 2')}

            {hoveredEvent && (
                <div
                    className="fixed bg-gray-800 text-white px-2 py-1 text-xs rounded z-50 whitespace-nowrap pointer-events-none"
                    style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`
                    }}
                >
                    {hoveredEvent.roundName}: {hoveredEvent.eventName}
                    {hoveredEvent.attended ? ' (Attended)' : ' (Missed)'}
                </div>
            )}
        </div>
    );
};

export default RusheeAttendance;
