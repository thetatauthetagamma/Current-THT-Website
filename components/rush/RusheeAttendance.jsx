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
    const [attendanceData, setAttendanceData] = useState([]);
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

                // Fetch required events (where attendance = true) from RushEvents
                const { data: requiredEvents, error: eventsError } = await supabase
                    .from('RushEvents')
                    .select('id, name, date')
                    .eq('attendance', true)
                    .order('date', { ascending: true })
                    .order('id', { ascending: true });

                if (eventsError) {
                    console.error('Error fetching required events:', eventsError);
                    setLoading(false);
                    return;
                }

                // Fetch the rushee's attendance records
                const { data: attendanceRecords, error: attendanceError } = await supabase
                    .from('Rushee_Attendance')
                    .select('event_name, uniqname')
                    .eq('uniqname', trimmedUniqname);

                if (attendanceError) {
                    console.error('Error fetching attendance data:', attendanceError);
                    setLoading(false);
                    return;
                }

                // Create a set of events the rushee has attended
                const attendedEvents = new Set();
                if (attendanceRecords && attendanceRecords.length > 0) {
                    attendanceRecords.forEach(record => {
                        if (record.event_name) {
                            attendedEvents.add(record.event_name.trim());
                        }
                    });
                }

                // Process required events and match with attendance
                const processedEvents = (requiredEvents || []).map((event, index) => {
                    const isAttended = attendedEvents.has(event.name.trim());
                    return {
                        eventId: event.id,
                        eventNumber: index + 1,
                        attended: isAttended,
                        eventName: event.name,
                        eventDate: event.date
                    };
                });

                setAttendanceData(processedEvents);
            } catch (error) {
                console.error('Unexpected error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceData();
    }, [uniqname]);

    const handleMouseEnter = (event, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            top: rect.top - 40,
            left: rect.left
        });
        setHoveredEvent(event);
    };

    const handleMouseLeave = () => {
        setHoveredEvent(null);
    };

    const renderAttendanceBlocks = () => {
        if (attendanceData.length === 0) {
            return (
                <div className="flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">Required Events</span>
                    <div className="text-xs text-gray-400">No required events found</div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 mb-1">Required Events ({attendanceData.length})</span>
                <div className="flex gap-1 flex-wrap">
                    {attendanceData.map((event, index) => (
                        <div
                            key={event.eventId || index}
                            className={`w-4 h-4 rounded-sm transition-all cursor-pointer hover:opacity-80 ${event.attended ? 'bg-green-500' : 'bg-red-500'
                                }`}
                            onMouseEnter={(e) => handleMouseEnter(event, e)}
                            onMouseLeave={handleMouseLeave}
                            title={`${event.eventName} - ${event.attended ? 'Attended' : 'Missed'}`}
                        />
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col space-y-1 ml-2">
                <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="w-4 h-4 bg-gray-200 rounded-sm animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 relative">
            {renderAttendanceBlocks()}

            {hoveredEvent && (
                <div
                    className="fixed bg-gray-800 text-white px-2 py-1 text-xs rounded z-50 whitespace-nowrap pointer-events-none"
                    style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`
                    }}
                >
                    {hoveredEvent.eventName}
                    {hoveredEvent.attended ? ' (Attended)' : ' (Missed)'}
                </div>
            )}
        </div>
    );
};

export default RusheeAttendance;
