import BroNavBar from "@/components/BroNavBar";
export default function BroResources() {
//TODO: Make it so that web head can add and edit resources from front end. 
  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]">

      <BroNavBar isPledge={false} />
      
      <ul className="space-y-2 font-bold flex-grow text-lg xs:max-sm:flex xs:max-sm:flex-col xs:max-sm:items-center pl-8">
        <h1 className="font-bold text-4xl py-4">Resources</h1>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded flex-grow ">
          <a href="https://forms.gle/qB3CHWFFnkVmSG3PA" target="_blank" className="block p-2 rounded">📋 Attendance Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdfHRTc4M4yQXpUBWtXyslxA2YPedpIl5wZ91OnCUKHvhA4Sg/viewform" target="_blank" className="block p-2 rounded">📝 Fraternity Feedback Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSeSvOo7mJgb0BVqQnZFSMQ7TQCWo3tcOxNe6ZEPTT2eAh9TXg/viewform" target="_blank" className="block p-2 rounded">📝 EBoard Feedback Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSfUTU0_aeKyi1cL5y-2_lhdQWmVQg86Th0YQnl_5_j-_SmO8w/viewform" target="_blank" className="block p-2 rounded">📝 Risk Manager Form W25</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://forms.gle/SM3GDZzfLDXgfhDz6" target="_blank" className="block p-2 rounded">👶 Pledge Feedback Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLScMzwW7Y9IXBiTk2XIL9jNb95Kq-qDCreHqghWyeatQcgeBgw/viewform" target="_blank" className="block p-2 rounded">💰 Reimbursement Form W25</a>
        </li>
      </ul>
    </div>
  )
}
