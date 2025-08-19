import { useEffect, useState } from "react";
import TimelineEvent from "./TimelineEvent";
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import supabase from "supabase"
import 'react-vertical-timeline-component/style.min.css';

const formatDate = (timestamp) => {
    if (timestamp) {
        const date = new Date(timestamp)
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString("en-US", options);
    }
    else {
        return "Date TBD"
    }

}

const formatTime = (timestamp) => {
    if (timestamp) {
        const date = new Date(timestamp)
        var options = { hour: 'numeric', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString("en-US", options);
    }
    else {
        return "Time TBD"
    }
}

const formatDateTime = (startTimestamp, endTimestamp) => {
    const dateStr = formatDate(startTimestamp);
    const startTime = formatTime(startTimestamp);
    const endTime = formatTime(endTimestamp);

    if (startTimestamp && endTimestamp) {
        return `${dateStr} • ${startTime} - ${endTime}`;
    } else if (startTimestamp) {
        return `${dateStr} • ${startTime}`;
    } else {
        return dateStr;
    }
}

const TimelineElement = ({ event }) => {
    return (
        <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{}}
            contentArrowStyle={{}}
            date={formatDateTime(event.date, event.start_time)}
            dateClassName={"xl:text-black"}
            iconStyle={{ background: '#8b0000', color: '#fff' }}
        >
            <h3 className="vertical-timeline-element-title" style={{ marginBottom: "5px" }}>
                {event.name}
            </h3>
            <h4 className="vertical-timeline-element-subtitle" style={{ color: "#aaa" }}>
                {event.location}
            </h4>
            <p className="" style={{ whiteSpace: "pre-wrap" }}>
                {event.description}
            </p>
        </VerticalTimelineElement >
    )

}

const Timeline = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchRushEvents()
    }, [])

    async function fetchRushEvents() {
        try {
            const { data, error } = await supabase
                .from('RushEvents')
                .select("*")
                .order('date', { ascending: true }) // First sort by date ascending
                .order('id', { ascending: true }); // Then sort by id ascending
            if (error) throw error
            if (data) setEvents(data);
            console.log(data);
        } catch (error) {
            console.error('Error fetching rush events:', error)
        }
    }

    return (
        <div className=" m-2 flex flex-col justify-center items-center">
            <h1 className="text-5xl font-bold z-3 pb-1 m-10 text-[#8b0000]"> Open Rush Events! </h1>
            <VerticalTimeline >
                {events.map((event, idx) => {
                    return <TimelineElement event={event} key={idx} />
                })}
            </VerticalTimeline >
        </div>
    )


}

export default Timeline