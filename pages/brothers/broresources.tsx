import BroNavBar from "@/components/BroNavBar";
export default function BroResources() {
//TODO: Make it so that web head can add and edit resources from front end. 
  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]">

      <BroNavBar isPledge={false} />
      
      <ul className="space-y-2 font-bold flex-grow text-lg xs:max-sm:flex xs:max-sm:flex-col xs:max-sm:items-center pl-8">
        <h1 className="font-bold text-4xl py-4">Resources</h1>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded flex-grow ">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSeTxmB4izmoL-nWGXb1Zo9XhAogTX9A3G5qvZ0DJbYzbAo5Rg/viewform" target="_blank" className="block p-2 rounded">📋 Attendance Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSfw_cjGj30e2fQCLhg0-bI3QnQ8h2C0AvIz1mXUtO9Cxs1rSA/viewform" target="_blank" className="block p-2 rounded">📝 Fraternity Feedback Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSfq6hfFpId8sGpt5jE9Yqa3QaylnTkVET_vCtzeRFJMniVZZw/viewform" target="_blank" className="block p-2 rounded">📝 EBoard Feedback Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdsr8YZ9j7BIgob_oMfVYjI0nl3ymy54BmM-FvAP0td0GUSpg/viewform" target="_blank" className="block p-2 rounded">📝 Risk Manager Form F24</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSfNNyhwN1R-PwXXp7xacAd4_QEu-FVPMiP5RU10sEd19k0mDw/viewform" target="_blank" className="block p-2 rounded">👶 Pledge Feedback Form</a>
        </li>
        <li className="hover:bg-gray-200 transition-colors duration-300 rounded flex-grow">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSd2m1KXGjHWSWUd3aMQapdcx0YG5Tfm_O0f7SUEe-xDkmmdpw/viewform" target="_blank" className="block p-2 rounded">💰 Reimbursement Form</a>
        </li>
      </ul>
    </div>
  )
}
