import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import defaultProfilePic from '../../media/default-profile.png';
import { BACKEND_URL } from '../../config';

const DoctorsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const navigate = useNavigate();

  // Mapped items per page based on viewport width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 625) {
        setItemsPerPage(1);
      } else if (window.innerWidth <= 850) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch doctors from backend on component mount
  useEffect(() => {
    fetch(`${BACKEND_URL || 'http://localhost:8080'}/api/doctors/publicDoctors`)
      .then((response) => response.json())
      .then((data) => {
        const mappedDoctors = data.map((doctor) => ({
          ...doctor, // spread to keep original fields for booking page
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialization: Array.isArray(doctor.specialization) ? doctor.specialization.join(', ') || "N/A" : doctor.specialization || doctor.designation || "N/A",
          experience: doctor.experience ? `${doctor.experience} years` : "0 years",
          age: `${doctor.age || 'N/A'}`,
          profileImage: doctor.profileImage || null,
          rating: doctor.rating || 0,
        }));

        // Sort by rating descending and take top 5
        const topDoctors = mappedDoctors.sort((a, b) => b.rating - a.rating).slice(0, 5);
        setDoctors(topDoctors);
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
      });
  }, []);

  const getDoctorImageUrl = (profileImage) => {
    if (!profileImage || profileImage === 'null' || profileImage === 'undefined') {
      return defaultProfilePic;
    }
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    const backendUrl = BACKEND_URL || 'http://localhost:8080';
    if (profileImage.startsWith('/')) {
      return `${backendUrl}${profileImage}`;
    }
    return `${backendUrl}/${profileImage}`;
  };

  const handleLeftClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? Math.max(0, doctors.length - itemsPerPage) : prevIndex - 1));
  };

  const handleRightClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex >= doctors.length - itemsPerPage ? 0 : prevIndex + 1));
  };

  return (
    <section className="mx-auto my-14 w-[95%] max-w-310 rounded-[28px] border border-(--jh-line-strong) bg-[radial-gradient(700px_260px_at_50%_-60px,rgba(200,162,74,0.14),transparent_70%),linear-gradient(180deg,var(--jh-sage-pale)_0%,#f7f8f3_100%)] px-8.5 pt-13 pb-14 shadow-[0_16px_40px_rgba(47,53,36,0.1)] sm:my-10 sm:px-4 sm:pt-10 sm:pb-11">
      <div className="mb-9 flex flex-col items-center gap-2.5 text-center">
        <h2 className="font-display m-0 text-[clamp(1.7rem,3.4vw,2.5rem)] font-semibold tracking-tight text-(--jh-olive-deep)">
          Meet our doctors
        </h2>
        <p className="m-0 max-w-130 text-base leading-relaxed text-muted-foreground">
          Certified Ayurvedic practitioners, ready to build a plan around you.
        </p>
        <div className="h-1 w-19.5 rounded-full bg-gradient-to-r from-(--jh-olive-leaf) via-(--jh-turmeric-gold) to-(--jh-bark-brown)"></div>
      </div>

      <div className="relative flex overflow-hidden py-1.5">
        <div
          className="flex w-full items-stretch transition-transform duration-300 ease-linear"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
          }}
        >
          {doctors.map((doctor, index) => {
            const isNew = !doctor.rating || Number(doctor.rating) <= 0;
            return (
              <div
                className="box-border flex shrink-0 px-3.5 py-3"
                style={{ flex: `0 0 ${100 / itemsPerPage}%`, width: `${100 / itemsPerPage}%` }}
                key={index}
              >
                <div
                  className="group relative box-border flex w-full cursor-pointer flex-col items-center overflow-hidden rounded-[20px] border border-(--jh-line-strong) bg-(--jh-surface) px-5 pt-6 pb-5.5 shadow-[0_8px_22px_rgba(47,53,36,0.08)] transition-[transform,box-shadow] duration-300 ease-out before:absolute before:inset-x-0 before:top-0 before:h-19 before:bg-gradient-to-br before:from-(--jh-olive-light) before:to-(--jh-olive-leaf) hover:-translate-y-2 hover:shadow-[0_22px_44px_rgba(47,53,36,0.16)]"
                  role="button"
                  tabIndex={0}
                  aria-label={`View profile of ${doctor.name}`}
                  onClick={() => navigate('/doctor-detail', { state: { doctor } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/doctor-detail', { state: { doctor } });
                    }
                  }}
                >
                  <div className="relative z-1 shrink-0">
                    <Avatar size="lg" className="size-27 border-4 border-white shadow-[0_6px_16px_rgba(47,53,36,0.18)]">
                      <AvatarImage
                        src={getDoctorImageUrl(doctor.profileImage)}
                        alt={doctor.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultProfilePic;
                        }}
                      />
                      <AvatarFallback>{doctor.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <Badge
                      variant={isNew ? "default" : "warning"}
                      className={`absolute right-0 bottom-0.5 border-2 border-white text-[0.68rem] font-extrabold shadow-[0_3px_8px_rgba(47,53,36,0.2)] ${isNew ? "bg-(--jh-olive-leaf) text-white" : "bg-(--jh-turmeric-gold) text-white"}`}
                    >
                      {isNew ? 'New' : `★ ${Number(doctor.rating).toFixed(1)}`}
                    </Badge>
                  </div>
                  <div className="z-1 mt-4 flex w-full flex-col items-center gap-3 text-center">
                    <p className="m-0 text-xl leading-tight font-extrabold text-foreground">{doctor.name}</p>
                    <span className="flex min-h-7.5 items-center rounded-full bg-(--jh-olive-leaf)/10 px-3.5 py-1.5 text-[0.8rem] leading-tight font-semibold text-(--jh-olive-leaf)">
                      {doctor.specialization}
                    </span>
                    <div className="flex w-full flex-col gap-0.5 border-t border-(--jh-line-strong) pt-2.5 pb-1">
                      <span className="text-[0.68rem] font-bold tracking-wide text-muted-foreground uppercase">Experience</span>
                      <strong className="text-[1.05rem] font-extrabold text-(--jh-olive-deep)">{doctor.experience}</strong>
                    </div>
                    <span className="mt-1 rounded-full bg-gradient-to-br from-(--jh-olive-light) to-(--jh-olive-deep) px-5.5 py-2.5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(85,107,47,0.28)] transition-[transform,box-shadow] duration-250 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_20px_rgba(85,107,47,0.4)]">
                      View Profile →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {doctors.length > itemsPerPage && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-1 z-10 size-11.5 -translate-y-1/2 rounded-full border-(--jh-line-strong) bg-(--jh-surface) text-lg text-(--jh-olive-deep) shadow-[0_6px_16px_rgba(47,53,36,0.15)] hover:-translate-y-1/2 hover:scale-106 hover:bg-(--jh-olive-leaf) hover:text-white sm:size-9.5"
              onClick={handleLeftClick}
              aria-label="Previous doctors"
            >
              ←
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-1 z-10 size-11.5 -translate-y-1/2 rounded-full border-(--jh-line-strong) bg-(--jh-surface) text-lg text-(--jh-olive-deep) shadow-[0_6px_16px_rgba(47,53,36,0.15)] hover:-translate-y-1/2 hover:scale-106 hover:bg-(--jh-olive-leaf) hover:text-white sm:size-9.5"
              onClick={handleRightClick}
              aria-label="Next doctors"
            >
              →
            </Button>
          </>
        )}
      </div>
    </section>
  );
};

export default DoctorsSection;
