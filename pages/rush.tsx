import Image from 'next/image';
import rush24 from '../public/rush2024.jpeg'
import Faq from '@/components/Faq'
import w24rush from '../public/rush24.jpg'
import Timeline from "@/components/Timeline"


export default function rush() {


  return (
    <div className="bg-gray-50 flex-grow">
      <script
        type="text/javascript"
        src="../node_modules/tw-elements/dist/js/tw-elements.umd.min.js"></script>

      <div className="inset-0 flex flex-col justify-center items-center md:pt-8 pt-4  text-[#8b0000]">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-bold z-3 pb-1" >Rush Theta Tau.</h1>
      </div>



      <div className=" flex-row text-lg sm:text-base md:text-lg lg:text-xl px-4 pr-6 pl-6 md:pr-40 md:pl-40 text-center md:py-4 font-semibold z-3 mt-2">
        <p>Interested in joining the Brotherhood?</p>
        <p>
          Please fill out our&nbsp;
          <a href="/apply" className="text-blue-500 hover:text-blue-300 ">
            application
          </a>
          &nbsp;and see below for more information!
        </p>
      </div>


      <div className='mb-10'>
        <div className="flex flex-col justify-center items-center">
          <iframe
            className="w-8/12 aspect-video"
            //width="1000"
            //height="560"
            src={`https://www.youtube.com/embed/GUQS9pmzn8c?si=V3Hq09TQWQlxdlxM`}
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="RushVideo"
          />
        </div>
      </div>


      <div className="flex flex-col justify-center items-center">
        <Timeline />
      </div>



      <div className='flex flex-grow flex-col pb-8 pt-8 bg-white border-b-2 border-[#8b000050]'>
        <div className="inset-0 flex flex-col justify-center items-center md:pt-8 md:pb-8 pb-4 text-[#8b0000]">
          <h1 className="text-2xl md:text-3xl font-bold z-3 mt-2" >Frequently Asked Questions</h1>

        </div >
        <div className='mb-8'>
          <Faq title={'What are fraternities and sororities?'} content={'Fraternities and sororities are what many people refer to "Greek Life"— societies that induct members for lifetime membership. Sororities are all-female greek organizations, while fraternities can be both all-male and co-ed organizations. Each organization has certain rules and values that make each one unique; however, they are often considered either "social" or "professional" groups. Professional greek organizations have a strong focus on developing their members professionally as well as creating a strong brotherhood or sisterhood.'} />
          <Faq title={'What kind of Greek organization is Theta Tau?'} content={'Theta Tau is a co-ed professional engineering fraternity. This makes us a professional fraternity, which means we value the professional development and conduct of our members more than a social fraternity might. We are also composed of members that have an interest in engineering, which unites us as another common focus. Finally, we are co-ed, and accept members of all genders.'} />
          <Faq title={'What is rushing?'} content={"Rushing is an interesting term to describe the first interactions you have with a greek organization. Theta Tau's rush week is designed to introduce you to the fraternity and its members. You don't have to be an engineer to attend Theta Tau rush events, and you are allowed to rush other greek fraternities and sororities while rushing Theta Tau."} />
          <Faq title={"I've heard that fraternities haze their members. Does Theta Tau do this as well?"} content={"Theta Tau absolutely does not tolerate hazing. For that matter, we are also a dry fraternity, and do not spend money on alcohol nor do we permit alcohol at our events, including rush events. We uphold a strict risk management policy and conduct ourselves in a professional manner."} />
          <Faq title={"Do I need to be an engineer to join?"} content={"We do not require you to be an engineer to rush with us. And once you are a brother, you won't lose your membership if you decide to leave the college of engineering or pursue another major. The only condition we do require is that you are in the college of engineering at the time of your initiation (January for a fall potential new member class and April for a winter potential new member class). This means if you are in the process of applying to the college, you shouldn't count yourself out!"} />
          <Faq title={"How is Theta Tau different from an honor society?"} content={"Honor societies are great for being around people that share an academic interest with you. These are excellent groups for furthering your interests in a topic, but the benefits often stop there. Because Theta Tau is a brotherhood, you will join a group of people that take friendships beyond the classroom and even the campus, and treat you like part of a family. You will connect with a group of people that have a diverse range of interests, which helps you diversify the kinds of contacts you make, and opens up opportunities beyond your major. And yet, Theta Tau will provide you with some of the greatest memories in college, 4 years that you don't want to just spend stuck in a textbook."} />
          <Faq title={"How do I join Theta Tau?"} content={"Joining Theta Tau itself is a great experience. First, attend our rush events. There, you'll get to introduce yourself to our brothers and get a feel for what the fraternity is like. Our rush events are typically low-stress, and simple activities that provide ample opportunity to hang out with brothers. Then, you will be given a bid, which is an invitation to become a potential new member with the fraternity. After accepting your bid, you will become a potential new member and start the process to becoming a brother!"} />
          <Faq title={"What can I expect at rush events?"} content={"Rush is typically at the beginning of the academic semester. Rush events are low-stress, simple activities that are designed to help get exposure to the fraternity, and for brothers to meet you. Our first rush events are typically information sessions where our rush chairs will give you an in-depth explanation of the process to becoming a brother of Theta Tau. Other rush events will be a mix of fun and professional events that vary from semester to semester. You definitely want to introduce yourself to as many brothers and other rushees as you can at every rush event. This is the best way to show your interest in the fraternity. Relax and have fun! Many rushees walk away from rush with some unexpected but important friendships."} />
          <Faq title={"What kind of time commitment is Theta Tau?"} content={"Rush is intended to be a low time commitment activity, and usually only about 4-6 hours per week (this is about the same as 1 credit class). Once you move further in the process and become a potential new member, more commitment will be expected of you. Your time commitment may average closer to 8-10 hours, however your time will be well spent developing meaningful relationships with brothers and fellow potential new members. Note that rushing and pledging are more rewarding the more time you invest in them. It is ultimately up to you to manage your time in a way to make the proper time commitment to the fraternity."} />
          <Faq title={"Am I eligible to join?"} content={"As a quick checklist, you are eligible to join Theta Tau as long as you can meet the following criteria at the time of your initiation (January for a fall potential new member class and April for a winter potential new member class): Enrolled at the College of Engineering, have at least 6 months before graduation, have a minimum (passing GPA) of 2.0, and not be a member of a competing Fraternity or Sorority."} />
          <Faq title={'How do I pronounce "Theta Tau"?'} content={'THAY-Ta TAH. Notice the pronunciation of "Tau" differs from the typical pronunciation you might hear in a math class. This is not by mistake, but rather a Greek grammatical rule.'} />
        </div>



      </div>

    </div>

  )
}
