import BroNavBar from "@/components/BroNavBar";

export default function pledgecalendar() {
  //TODO: Get link to pledge calendar from supabase, which is uploaded by the moms. 
  return (
    <div className="flex md:flex-row flex-col flex-grow  border-b-2 border-[#a3000020]">
      <BroNavBar isPledge={true}/>
      <div className="flex-grow">
      
        <div className="flex-grow h-full m-4">
          <iframe src="https://calendar.google.com/calendar/embed?src=c_07c56fe6aa179039a52aa0ede29675761de45eae51a8c7829224f24c6635661f%40group.calendar.google.com&ctz=America%2FNew_York" className="flex-grow h-5/6 w-full"></iframe>
        </div>
      </div>
    </div>
  );
};
