import Image from 'next/image';
import gear from '../public/theta-tau-gear.png'
import supabase from '../supabase'
import React, { useEffect, useRef, useState } from 'react';
import HorizontalMarquee from '../components/HorizontalMarquee';
import CountUp from 'react-countup';

import Danny from '../public/eboard/Danny.jpg';
import Ella from  '../public/eboard/Ella.jpg';
import Anthony from  '../public/eboard/Anthony.jpg';
import Elliot from '../public/eboard/Elliot.jpeg';
import Michelle from '../public/eboard/Michelle.jpg';
import Michael from '../public/eboard/Micheal.jpeg';
import JV from '../public/eboard/JV.jpeg';
import image1 from '../public/companies/1.jpg';
import image2 from '../public/companies/2.jpg';
import image3 from '../public/companies/3.jpg';
import image4 from '../public/companies/4.jpg';
import image5 from '../public/companies/5.jpg';
import image6 from '../public/companies/6.jpg';
import image7 from '../public/companies/7.jpg';
import image8 from '../public/companies/8.jpg';
import image9 from '../public/companies/9.jpg';
import image10 from '../public/companies/10.jpg';
import image11 from '../public/companies/11.jpg';
import image12 from '../public/companies/12.jpg';
import image13 from '../public/companies/13.jpg';
import image14 from '../public/companies/14.jpg';
import image15 from '../public/companies/15.jpg';
import image16 from '../public/companies/16.jpg';
import image17 from '../public/companies/17.jpg';
import image18 from '../public/companies/18.jpg';
import image19 from '../public/companies/19.jpg';
import image20 from '../public/companies/20.jpg';
type SetStateFunction = (value: string) => void;


const firstrow = [image1, image2, image3, image4, image5, image6, image7, image8, image9, image10 , image11, image12, image13, image14, image15, image16, image17, image18, image19, image20];

export default function members() {
  const [regentFirst, setRegentFirst] = useState('');
  const [regentLast, setRegentLast] = useState('');
  const [regentImg, setRegentImg] = useState('');
  const [viceFirst, setViceFirst] = useState('');
  const [viceLast, setViceLast] = useState('');
  const [viceImg, setViceImg] = useState('');
  const [scribeFirst, setScribeFirst] = useState('');
  const [scribeLast, setScribeLast] = useState('');
  const [scribeImg, setScribeImg] = useState('');
  const [treasurerFirst, setTreasurerFirst] = useState('');
  const [treasurerLast, setTreasurerLast] = useState('');
  const [treasurerImg, setTreasurerImg] = useState('');
  const [corsecFirst, setCorsecFirst] = useState('');
  const [corsecLast, setCorsecLast] = useState('');
  const [corsecImg, setCorsecImg] = useState('');

  const refActiveMembers = useRef(null);
  const refDifferentMajors = useRef(null);
  const refEmploymentRate = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-open-menu');
          }
        });
      },
      { threshold: 0.1 }
    );

    [refActiveMembers, refDifferentMajors, refEmploymentRate].forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      [refActiveMembers, refDifferentMajors, refEmploymentRate].forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);
  useEffect(() => {
    const fetchEBoard = async (
      adminRole: string,
      setFirstName: SetStateFunction,
      setLastName: SetStateFunction,
      setImage: SetStateFunction
    ) => {
      try {
        const { data, error } = await supabase
          .from('Brothers')
          .select('*')
          .eq('adminrole', adminRole);

        if (error) {
          throw error;
        }

        if (data) {
          setFirstName(data[0].firstname);
          setLastName(data[0].lastname);
          const { userid } = data[0];
          const { data: ImageData, error: imageError } = await supabase.storage
          .from('brothers')
          .download(`${userid}.jpeg`);

        if (!imageError) {
          setImage(URL.createObjectURL(ImageData));

        }
        }
      } catch (error) {
        // Handle errors if needed
      }
    };

    fetchEBoard('regent', setRegentFirst, setRegentLast, setRegentImg);
    fetchEBoard('vice', setViceFirst, setViceLast, setViceImg);
    fetchEBoard('scribe', setScribeFirst, setScribeLast, setScribeImg);
    fetchEBoard('corsec', setCorsecFirst,setCorsecLast, setCorsecImg);
    fetchEBoard('treasurer', setTreasurerFirst,setTreasurerLast, setTreasurerImg)
  }, []);



    return (
      <div className='flex-grow flex-col'>
        <div className="bg-gray-50 flex flex-grow flex-col pr-6 pl-6 md:pr-40 md:pl-40 md:pt-8 md:pb-8 pt-4 pb-4 border-b-2 border-[#8b000050]">
           <h1 className="pt-4 pb-4 text-3xl md:text-4xl font-bold mt-2 text-center text-[#8b0000]" >Executive Board</h1>
           <div className="flex flex-col md:flex-row items-center justify-around md:text-md text-sm  md:pt-8 pt-4 pb-4  top-0">
            
            <div className='flex-col text-center md:w-1/5 w-3/4 md:pb-0 pb-4 pr-1 pr-3 pl-3 md:self-start'>
              <div className='w-full h-full'>
              <Image
                src={JV}
                alt="Gear icon"
                className='w-full h-full rounded-full object-cover'
              />
              </div>
              <h1 className="font-semibold text-lg pt-4" >{regentFirst} {regentLast}</h1>
              <h1 className="md:text-lg text-md" >Regent</h1>
            </div>

            <div className='flex-col text-center md:w-1/5 w-3/4 md:pb-0 pb-4 pr-3 pl-3 md:self-start'>
              <Image
                src={Anthony}
                alt="Gear icon"
                className='w-full h-full rounded-full'
              />
              <h1 className="font-semibold md:text-lg text-md pt-4" >{viceFirst} {viceLast}</h1>
              <h1 className=" md:text-lg sm:text-sm text-md" >Vice Regent</h1>
            </div>

            <div className='flex-col text-center md:w-1/5 w-3/4 md:pb-0 pb-4 pr-3 pl-3 md:self-start'>
              <Image
                src={Ella}
                alt="Gear icon"
                className='w-full h-full rounded-full'
              />
              <h1 className="font-semibold md:text-lg text-md pt-4" >{scribeFirst} {scribeLast}</h1>
              <h1 className="md:text-lg text-md" >Scribe</h1>
            </div>

            <div className='flex-col text-center md:w-1/5 w-3/4 md:pb-0 pb-4  pr-3 pl-3 md:self-start'>
              <Image
                src={Michael}
                alt="Gear icon"
                className='w-full h-full rounded-full'
              />
              <h1 className="font-semibold md:text-lg text-md pt-4" >{treasurerFirst} {treasurerLast}</h1>
              <h1 className="md:text-lg text-md" >Treasurer</h1>
            </div>

            <div className='flex-col text-center md:w-1/5 w-3/4 pr-3 pl-3 md:self-start'>
                <Image
                  src={Elliot}
                  alt="Gear icon"
                  className='w-full h-full rounded-full'
                />
                <h1 className="font-semibold md:text-lg text-md pt-4" >{corsecFirst} {corsecLast}</h1>
                <h1 className="md:text-lg text-md" >Corresponding Secretary</h1>
              </div>

           </div>
        </div>

        <div className="bg-white flex flex-grow flex-col pr-6 pl-6 md:pr-40 md:pl-40 md:pt-8 md:pb-8 pt-4 pb-4">
           <h1 className="pt-4 pb-4 text-3xl md:text-4xl font-bold mt-2  text-[#8b0000] text-center" >Brothers</h1>
           <div className='flex flex-row md:pt-8 pt-4 justify-around items-center'>
            <div className='flex flex-col text-center'>
              <div className='font-bold text-[#8b0000] text-3xl sm:text-4xl md:text-5xl lg:text-6xl'>
              <CountUp start={0} end={70} duration={2.5} suffix="+" />
              </div>
              <div className='font-semibold text-[#8b000098] md:text-lg text-[15px]'>
                Active Members
              </div>

            </div>
            <div className='flex flex-col text-center'>
              <div className='font-bold text-[#8b0000] text-3xl sm:text-4xl md:text-5xl lg:text-6xl'>
              <CountUp start={0} end={15} duration={2.5} suffix="+" />
              </div>
              <div className='font-semibold text-[#8b000098] md:text-lg text-[15px]'>
                Different Majors
              </div>
              
            </div>
            <div className='flex flex-col text-center'>
              <div className='font-bold text-[#8b0000] text-3xl sm:text-4xl md:text-5xl lg:text-6xl'>
              <CountUp start={0} end={100} duration={2.5} suffix="%" />
              </div>
              <div className='font-semibold text-[#8b000098] md:text-lg text-[15px]'>
                Employment Rate
              </div>
            </div>
           </div>


           <div className='pt-8 text-left flex flex-col '>
              <div className='pb-4 text-3xl font-semibold mt-2  text-[#8b0000] text-left'>
                Theta Tau is
              </div>
              <div className="pt-4 pb-4 text-lg">
                first and foremost a brotherhood of engineers. 
                Being a brother of Theta Tau means that you have a community 
                of brilliant men AND women not only on campus, but across the 
                country that will see you as family. Being a brother means you 
                hold a strong connection to a broad network of other engineers - 
                a network that permeates through your academic, professional, and social life.
              </div>
              <div className="pt-4 pb-4 text-lg">
                This network is a support structure that you can rely on in the face of 
                struggles that you will face in your college career. Being a brother 
                means being part of a community that you can depend on beyond the campus 
                and throughout your life. Being a brother means building deep relationships 
                with a diverse group of people who hold vast reservoirs of insight and experience 
                in many areas of life. The wealth of these experiences enriches your life and 
                teaches you lessons that you can't learn from the classroom or even a job. 
                Being a brother means building a college experience that is incredibly 
                unique and valuable.
              </div>
              <div className="pt-4 pb-4 text-lg">
                When you ask someone why they joined Theta Tau, you'll probably get a 
                diverse set of answers. Some join because they seek professional growth. 
                Others join to meet more engineers in their major and across disciplines. 
                Some are attracted to networking opportunities or have heard that Theta Tau 
                is the oldest and largest Professional Engineering Fraternity in the country.
              </div>
              <div className="pt-4 pb-4 text-lg">
              However, when you ask someone why they stayed, and continue to participate 
              in the Fraternity, you'll likely hear one answer. It's the people. 
              Among all other things, it's the people, their values, and their culture 
              that make your college experience, and what you will remember years after 
              you graduate. This is especially true with Theta Gamma Chapter, which is 
              made up of some of the most diverse and extraordinary engineers you will 
              ever meet. These people are going places.
              </div>
           </div>
        </div>




        <div className='pr-6 pl-6 md:pl-40 md:pr-40 pb-20 border-b-2 border-[#8b000050]'>
          <HorizontalMarquee images={firstrow}/>
        </div>
       





        
        
      </div>
    )
}