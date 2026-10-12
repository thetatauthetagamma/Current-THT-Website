import BroNavBar from "@/components/BroNavBar";

export default function pledgecalendar() {
  //TODO: Get link to pledge calendar from supabase, which is uploaded by the moms. 
  return (
    <div className="flex md:flex-row flex-col flex-grow  border-b-2 border-[#a3000020]">
      <BroNavBar isPledge={true}/>
      <div className="flex-grow">
      
        <div className="flex-grow h-full m-4">
          <iframe src="https://calendar.google.com/calendar/embed?src=c_37dfffe95af429d2a5a5640af345fd1cbef66272ac6df76227a9431890f514d0%40group.calendar.google.com&ctz=America%2FNew_York" className="flex-grow h-5/6 w-full"></iframe>
        </div>
      </div>
    </div>
  );
};
