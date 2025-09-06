import React, { useState, useEffect } from 'react';
import BroNavBar from '@/components/BroNavBar';
import supabase from '@/supabase';

const AttendanceManager = () => {
    const [rushees, setRushees] = useState([]);
    const [selectedRushee, setSelectedRushee] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Round 1 and Round 2 events

    useEffect(() => {
        // Check if the user is an admin
        const checkAdmin = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.email) {
                const userUniqname = sessionData.session.user.email.split('@')[0];

                const { data, error } = await supabase
                    .from('Brothers')
                    .select('adminrole')
                    .eq('userid', userUniqname)
                    .single();

                if (!error && data) {
                    setIsAdmin(data.adminrole === 'dev' || data.adminrole === 'rush');
                }
            }
        };

        checkAdmin();
    }, []);

    useEffect(() => {
        // Fetch all rushees if user is admin
        const fetchRushees = async () => {
            if (!isAdmin) return;

            const { data, error } = await supabase
                .from('Rushees')
                .select('uniqname, firstname, lastname')
                .order('firstname', { ascending: true });

            if (error) {
                console.error('Error fetching rushees:', error);
                return;
            }

            setRushees(data || []);
        };

        fetchRushees();
    }, [isAdmin]);

    // Round 1 and Round 2 events - same as defined in RusheeAttendance.jsx
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

    useEffect(() => {
        // Fetch attendance data for selected rushee
        const fetchAttendance = async () => {
            if (!selectedRushee) return;

            setLoading(true);

            try {
                // Get all attendance records for this rushee
                const { data, error } = await supabase
                    .from('Rushee_Attendance')
                    .select('*')
                    .eq('uniqname', selectedRushee);

                if (error) {
                    console.error('Error fetching attendance:', error);
                    setMessage({ text: 'Failed to load attendance data', type: 'error' });
                    setAttendanceData([]);
                    return;
                }

                // Create a set of events the rushee has attended
                const attendedEvents = new Set();
                if (data) {
                    data.forEach(record => {
                        attendedEvents.add(record.event);
                    });
                }

                // Create attendance records with structure needed for the UI
                const allAttendanceRecords = [];

                // Round 1 events
                EVENTS.round1.forEach((eventName, index) => {
                    allAttendanceRecords.push({
                        id: `r1-${index}`,
                        uniqname: selectedRushee,
                        event: eventName,
                        event_round: 1,
                        event_number: index + 1,
                        event_name: eventName,
                        attended: attendedEvents.has(eventName)
                    });
                });

                // Round 2 events
                EVENTS.round2.forEach((eventName, index) => {
                    allAttendanceRecords.push({
                        id: `r2-${index}`,
                        uniqname: selectedRushee,
                        event: eventName,
                        event_round: 2,
                        event_number: index + 1,
                        event_name: eventName,
                        attended: attendedEvents.has(eventName)
                    });
                });

                setAttendanceData(allAttendanceRecords);
            } catch (error) {
                console.error('Unexpected error fetching attendance:', error);
                setMessage({ text: 'An error occurred while loading attendance data', type: 'error' });
                setAttendanceData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [selectedRushee]);

    const handleRusheeChange = (e) => {
        setSelectedRushee(e.target.value);
    };

    const initializeAttendance = async () => {
        if (!selectedRushee) {
            setMessage({ text: 'Please select a rushee first', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            // First, clear any existing attendance records for this rushee
            const { error: deleteError } = await supabase
                .from('Rushee_Attendance')
                .delete()
                .eq('uniqname', selectedRushee);

            if (deleteError) {
                throw deleteError;
            }

            // We don't insert any records initially - we just display all possible events
            // with "not attended" status. Records are only created when attendance is marked.
            setMessage({ text: 'Attendance records initialized successfully', type: 'success' });

            // Refresh attendance data by calling the same function used in the useEffect
            // This will create the virtual attendance records for display
            const allAttendanceRecords = [];

            // Round 1 events
            EVENTS.round1.forEach((eventName, index) => {
                allAttendanceRecords.push({
                    id: `r1-${index}`,
                    uniqname: selectedRushee,
                    event: eventName,
                    event_round: 1,
                    event_number: index + 1,
                    event_name: eventName,
                    attended: false
                });
            });

            // Round 2 events
            EVENTS.round2.forEach((eventName, index) => {
                allAttendanceRecords.push({
                    id: `r2-${index}`,
                    uniqname: selectedRushee,
                    event: eventName,
                    event_round: 2,
                    event_number: index + 1,
                    event_name: eventName,
                    attended: false
                });
            });

            setAttendanceData(allAttendanceRecords);

        } catch (error) {
            console.error('Error:', error);
            setMessage({ text: 'An error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceToggle = async (eventId, currentValue) => {
        if (!selectedRushee) return;

        setLoading(true);

        try {
            const record = attendanceData.find(a => a.id === eventId);
            if (!record) return;

            const newAttendedValue = !currentValue;

            if (newAttendedValue) {
                // If marking as attended, insert a record
                const { error } = await supabase
                    .from('Rushee_Attendance')
                    .upsert({
                        uniqname: selectedRushee,
                        event_name: record.event
                    });

                if (error) {
                    throw error;
                }
            } else {
                // If marking as not attended, delete the record
                const { error } = await supabase
                    .from('Rushee_Attendance')
                    .delete()
                    .eq('uniqname', selectedRushee)
                    .eq('event_name', record.event);

                if (error) {
                    throw error;
                }
            }

            // Update local state to reflect the change
            setAttendanceData(prevData =>
                prevData.map(item =>
                    item.id === eventId
                        ? { ...item, attended: newAttendedValue }
                        : item
                )
            );

            setMessage({ text: 'Attendance updated successfully', type: 'success' });
        } catch (error) {
            console.error('Error updating attendance:', error);
            setMessage({ text: 'An error occurred while updating attendance', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <BroNavBar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Rushee Attendance Manager</h1>

                {!isAdmin ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        <p>You need admin access to manage rushee attendance.</p>
                    </div>
                ) : (
                    <>
                        {message.text && (
                            <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Select Rushee</label>
                            <div className="flex gap-4">
                                <select
                                    className="border p-2 rounded w-full md:w-1/3"
                                    value={selectedRushee || ''}
                                    onChange={handleRusheeChange}
                                >
                                    <option value="">-- Select a rushee --</option>
                                    {rushees.map(rushee => (
                                        <option key={rushee.uniqname} value={rushee.uniqname}>
                                            {rushee.firstname} {rushee.lastname} ({rushee.uniqname})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={initializeAttendance}
                                    disabled={loading || !selectedRushee}
                                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
                                >
                                    Reset Attendance Records
                                </button>
                            </div>
                        </div>

                        {selectedRushee && (
                            <div className="mt-6">
                                <h2 className="text-xl font-semibold mb-4">Attendance Records for {selectedRushee}</h2>

                                {loading ? (
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : attendanceData.length === 0 ? (
                                    <p>No attendance records found. Click "Reset Attendance Records" to initialize the attendance view.</p>
                                ) : (
                                    <div className="bg-white shadow-md rounded-lg p-4">
                                        {/* Round 1 */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-medium mb-3">Round 1 Events</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {attendanceData.filter(a => a.event_round === 1).map((event) => (
                                                    <div key={event.id} className="flex items-center p-3 border rounded hover:bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={event.attended}
                                                            onChange={() => handleAttendanceToggle(event.id, event.attended)}
                                                            className="h-5 w-5 mr-3"
                                                            id={`event-${event.id}`}
                                                        />
                                                        <label htmlFor={`event-${event.id}`} className="flex-1 cursor-pointer">
                                                            {event.event_name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Round 2 */}
                                        <div>
                                            <h3 className="text-lg font-medium mb-3">Round 2 Events</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {attendanceData.filter(a => a.event_round === 2).map((event) => (
                                                    <div key={event.id} className="flex items-center p-3 border rounded hover:bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={event.attended}
                                                            onChange={() => handleAttendanceToggle(event.id, event.attended)}
                                                            className="h-5 w-5 mr-3"
                                                            id={`event-${event.id}`}
                                                        />
                                                        <label htmlFor={`event-${event.id}`} className="flex-1 cursor-pointer">
                                                            {event.event_name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-6 text-sm text-gray-500">
                                            <p>Note: Changes are saved automatically when you check/uncheck an attendance box.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AttendanceManager;
