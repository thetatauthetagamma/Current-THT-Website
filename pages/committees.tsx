import Pd from "public/committees/pd1.jpeg"
import Academic from "../public/committees/academic.jpeg"
import RecSports from "../public/committees/RecSports.jpg"
import Marketing from "../public/committees/Marketing.jpeg"
import Social from "../public/committees/social1.jpeg"
import Brohood from "../public/committees/brohood.jpeg"
import wellness from "../public/committees/wellness1.jpeg"
import diversity from "../public/committees/diversity1.jpeg"
import philanthropy from "../public/committees/phil.jpeg"
import historian from "../public/committees/hist.jpeg"
import recsports from "../public/committees/recsports.jpeg"
import Image from 'next/image';
import Head from 'next/head'
import frat from '../public/fratphoto.jpg'
import pledge from '../public/committees/pledge1.jpeg'
import socialmedia from '../public/committees/socialmedia.jpeg'
import corporate from '../public/committees/pd.jpeg'

/*
This page displays the committees with a picture of each and a description of each committee. 
Should continually update the photos that are displayed here and encourage committee heads to take pics at events. 
*/

export default function committees() {
  return (
    <div className='flex-grow flex-col'>
      <div className=' pb-4'>
        <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow pr-4 pl-4 md:pr-32 lg:pr-64 md:pl-32 lg:pl-64 md:pt-8 md:pb-8 pt-4 pb-4 ">
          <div className="flex flex-col w-full items-center">
            <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Professional Development</h1>
            <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
              The Professional Development Committee is dedicated to empowering our members for success in their careers. We provide essential support, including assistance with recruitment, networking opportunities, and assist in organizing the Career Fair. Moreover, we help members navigate complex class schedules and serve as a valuable resource for any professional endeavor. Our commitment is to ensure that our brothers are well-prepared to excel in university and in the engineering industry, building strong foundations for their future careers.
            </div>
          </div>
          <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4">

            <Image
              src={Pd}
              alt="Full Fraternity Photo"
              className="w-[100%] height-auto"
            />

          </div>
        </div>
      </div>

      <div className=' pb-4'>
        <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow pr-4 pl-4 md:pr-32 lg:pr-64 md:pl-32 lg:pl-64 md:pt-8 md:pb-8 pt-4 pb-4 ">
          <div className="flex flex-col w-full items-center">
            <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Brotherhood</h1>
            <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
              The Brotherhood Committee is dedicated to fostering a strong sense of unity among brothers. Through planned events and activities, the committee aims to bring our brothers together, encouraging meaningful connections and a supportive environment. By nurturing bonds and promoting solidarity, the Brotherhood Committee plays a vital role in cultivating the close-knit and supportive community of Theta Tau.
            </div>
          </div>
          <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4">

            <Image
              src={Brohood}
              alt="Full Fraternity Photo"
              className="w-[100%] height-auto"
            />

          </div>
        </div>
      </div>


      <div className=' pb-4'>
        <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow pr-4 pl-4 md:pr-32 lg:pr-64 md:pl-32 lg:pl-64 md:pt-8 md:pb-8 pt-4 pb-4 ">
          <div className="flex flex-col w-full items-center">
            <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Philanthropy</h1>
            <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
              The Philanthropy Committee plays a pivotal role in Theta Tau by spearheading our commitment to community service and giving back. This dedicated team continually brainstorms fresh community service initiatives for the chapter to engage in, gathering feedback from our members on the causes and areas they're passionate about. They are responsible for planning and executing impactful chapter-wide volunteering events such as DAPCEP Shadow Day, the Out of the Darkness Walk, and many more. The committee's mission is to inspire and facilitate our chapter's involvement in meaningful philanthropic endeavors, fostering a spirit of service and social responsibility among our brothers.
            </div>
          </div>
          <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4">

            <Image
              src={philanthropy}
              alt="Full Fraternity Photo"
              className="w-[100%] height-auto"
            />

          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row ">
        <div className='flex flex-grow pb-4 md:w-1/2 md:pr-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16 md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Pledge</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
                The Pledge Committee plays a vital role in our fraternity's growth and unity. Their primary focus is on educating new members and preparing them for their transition to full brothers by the end of the pledge semester. They organize various events to foster camaraderie among pledges, helping them become acquainted with each other and fully integrated into our brotherhood. Through mentorship, guidance, and immersive activities, the committee ensures that pledges are well-prepared to embrace their roles as active members and contribute to the fraternity's values and traditions.



              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4 self-end">

              <Image
                src={pledge}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


        <div className='flex flex-grow pb-4 md:w-1/2 md:pl-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16  md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Academic</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
                The Academic Committee is dedicated to enhancing the educational experience of our members in the field of engineering. Throughout the semester, we organize and host study tables to provide a conducive space for academic growth. We also extend a wealth of academic resources to our fraternity brothers, ranging from study materials to tutoring support. In addition, our proactive approach brings together members with common classes, interests, and majors, fostering a spirit of collaboration that not only bolsters individual academic performance but also strengthens the unity of our fraternity. We are committed to empowering our members to excel academically and thrive in their engineering pursuits, forging a path towards success in their educational journey.
              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4 self-end">

              <Image
                src={Academic}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


      </div>




      <div className="flex flex-col md:flex-row ">
        <div className='flex flex-grow pb-4 md:w-1/2 md:pr-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16 md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Rec Sports</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
                The Rec Sports Committee contributes to enabling members to come together outside of the academic setting. They are responsible for organizing intramural sports teams, encouraging friendly competition and teamwork. Additionally, the committee coordinates a variety of fun activities, such as field days, ice skating events, and trips to trampoline parks, providing members with opportunities to bond and relax outside of their academic and professional commitments.
              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4 self-end">

              <Image
                src={recsports}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


        <div className='flex flex-grow pb-4 md:w-1/2 md:pl-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16  md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Social</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
                The Social Committee takes the lead in making sure that our professional engineering fraternity members have unforgettable social experiences. From planning and executing our most prominent events like Semi-formal to organizing engaging Retreats, we're here to ensure that our fraternity remains a hub of fun, connection, and camaraderie. We understand that a healthy work-life balance is essential, and we're committed to fostering a vibrant social environment within our fraternity.
              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4 self-end">

              <Image
                src={Social}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


      </div>


      <div className="flex flex-col md:flex-row ">
        <div className='flex flex-grow pb-4 md:w-1/2 md:pr-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16 md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Corporate</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
                The Corporate Committee engages in outreach to establish public networking events with prominent companies and accomplished Theta Tau alumni. The Corporate Committee also helps organize the UMich Winter Career Fair. Through these efforts, the Corporate Committee contributes to the career development and success of not only our members, but also the UMich engineering community.
              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4">

              <Image
                src={corporate}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


        <div className='flex flex-grow pb-4 md:w-1/2 md:pl-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16  md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Diversity</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
                The Diversity Committee at our professional engineering fraternity is dedicated to promoting diversity and inclusion within our chapter. We accomplish this by organizing a variety of events throughout the year, including the popular SHPE-NSBE-THT Game Night and Diversity Day at the DIA. These events provide opportunities for our members to engage with diverse perspectives and backgrounds. We also work to design rush events that encourage rushees to participate in discussions about identity, diversity, and the inequalities they may have encountered on campus. Through these initiatives, the Diversity Committee fosters an environment that welcomes all voices and experiences, making our fraternity an inclusive and vibrant community.
              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4">

              <Image
                src={diversity}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


      </div>




      <div className="flex flex-col md:flex-row ">
        <div className='flex flex-grow pb-4 md:w-1/2 md:pr-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16 md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Wellness</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4">
                The Wellness Committee is dedicated to nurturing the holistic well-being of our fraternity brothers and pledges. We understand the importance of a sound mind and body in the demanding field of engineering. We provide a wealth of information and resources to support mental and physical health, offering tools such as chapter meditation sessions and calming videos to help manage the stresses of academic life. Throughout the semester, we also plan and host events like group yoga to promote physical fitness and mental relaxation. Our mission is to create a supportive and balanced environment where our members can thrive, not only as engineers but as individuals.
              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4">

              <Image
                src={wellness}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


        <div className='flex flex-grow pb-4 md:w-1/2 md:pl-2'>
          <div className="flex flex-col md:flex-col bg-gray-100 justify-center flex-grow px-4 md:px-16  md:pt-8 md:pb-8 pt-4 pb-4 ">
            <div className="flex flex-col w-full items-center">
              <h1 className="pt-4 pb-4 text-2xl md:text-4xl font-bold md:text-left text-center text-[#8b0000]" >Historian</h1>
              <div className="flex flex-col md:flex-row  md:text-lg text-md pt-4 pb-4 flex-grow">
                The Historian committee is dedicated to preserving the memories and moments that define Theta Tau. We capture a wide range of experiences, from documenting events and activities to taking professional headshots and candid photos of our members. Our goal is to create a visual record that allows both current and future brothers to look back on the fun and professional moments we share as a close-knit brotherhood, ensuring that our collective history is never forgotten.
              </div>
            </div>
            <div className="w-full  flex flex-grow justify-center items-center pt-4 pb-4 ">

              <Image
                src={historian}
                alt="Full Fraternity Photo"
                className="w-[100%] height-auto self-end"
              />

            </div>
          </div>
        </div>


      </div>

    </div>



  );
}