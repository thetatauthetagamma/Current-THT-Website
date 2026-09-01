import React from 'react';
import FastMarquee from 'react-fast-marquee';
import Image from "next/image";

// brotherhood first row images are here:
import image1 from '../images/homepage/brotherhood/1.jpg';
import image2 from '../images/homepage/brotherhood/2.jpg';
import image3 from '../images/homepage/brotherhood/3.jpg';
import image4 from '../images/homepage/brotherhood/4.jpg';
import image5 from '../images/homepage/brotherhood/5.jpg';
import image6 from '../images/homepage/brotherhood/6.jpg';
import image7 from '../images/homepage/brotherhood/7.jpg';
import image8 from '../images/homepage/brotherhood/8.jpg';
import image9 from '../images/homepage/brotherhood/9.jpg';
import image10 from '../images/homepage/brotherhood/10.jpg';
import image11 from '../images/homepage/brotherhood/11.jpg';
import image12 from '../images/homepage/brotherhood/12.jpg';

// brotherhood second row images are here:
import image13 from '../images/homepage/brotherhood/13.jpg';
import image14 from '../images/homepage/brotherhood/14.jpg';
import image15 from '../images/homepage/brotherhood/15.jpg';
import image16 from '../images/homepage/brotherhood/16.jpg';
import image17 from '../images/homepage/brotherhood/17.jpg';
import image18 from '../images/homepage/brotherhood/18.jpg';
import image19 from '../images/homepage/brotherhood/19.jpg';
import image20 from '../images/homepage/brotherhood/20.jpg';
import image21 from '../images/homepage/brotherhood/21.jpg';
import image22 from '../images/homepage/brotherhood/22.jpg';
import image23 from '../images/homepage/brotherhood/23.jpg';
import image24 from '../images/homepage/brotherhood/24.jpg';

const Brotherhood: React.FC = () => {
  const firstrow = [
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
    image7,
    image8,
    image9,
    image10,
    image11,
    image12,
  ];
  const secondrow = [
    image13,
    image14,
    image15,
    image16,
    image17,
    image18,
    image19,
    image20,
    image21,
    image22,
    image23,
    image24,
  ];

  return (
<div className="flex flex-col">
      <div className="">BROTHERHOOD</div>
      <div className="relative h-60 w-40">
        <FastMarquee
          speed={60}
          delay={0}
          pauseOnHover
          direction="left"
          gradient={false}
        >
          {firstrow.map((image, index) => (
            <div key={index} className="w-full h-full relative">
              <Image
                src={image}
                alt={`brotherhood-${index}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </FastMarquee>
      </div>
      <div className="relative h-60 w-40">
        <FastMarquee
          speed={60}
          delay={0}
          pauseOnHover
          gradient={false}
          direction="left"
        >
          {secondrow.map((image, index) => (
            <div key={index} className="w-full h-full relative">
              <Image
                src={image}
                alt={`brotherhood-${index}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </FastMarquee>
      </div>
    </div>
  );
};

export default Brotherhood;
