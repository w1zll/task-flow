import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const useLandingGSAP = () => {
  const scrollArrowRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const accentRef = useRef<HTMLElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const cardsRef = useRef<HTMLDivElement[]>([]);
  const featuresTitleRef = useRef<HTMLHeadElement>(null);
  const featuresSubtitleRef = useRef<HTMLParagraphElement>(null);

  const splitText = (text: string) => {
    return text
      .split('')
      .map((char) => {
        return char === ' '
          ? `<span style="display:inline-block vertical-align:top;">&nbsp;</span>`
          : `<span style="display:inline-block; overflow:hidden; vertical-align:top;">
                <span style="display:inline-block">${char}</span>
               </span>`;
      })
      .join('');
  };

  useGSAP(() => {
    gsap.to(scrollArrowRef.current, {
      y: 8,
      duration: 0.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 2,
    });

    if (titleRef.current) {
      const alreadySplit = titleRef.current.querySelector('span');
      if (!alreadySplit) {
        const originalText = titleRef.current.textContent ?? '';
        console.log(`originalText: ${originalText}`);
        titleRef.current.innerHTML = splitText(originalText);
      }
    }

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.from(badgeRef.current, {
      y: -30,
      autoAlpha: 0,
      duration: 0.5,
    });

    if (titleRef.current) {
      const chars =
        titleRef.current.querySelectorAll<HTMLSpanElement>('span > span');
      chars.forEach((char) => {
        char.style.visibility = 'hidden';
      });
      tl.from(titleRef.current, {
        autoAlpha: 0,
        duration: 0,
      });
      tl.from(
        chars,
        {
          y: '110%',
          duration: 0.5,
          autoAlpha: 0,
          stagger: 0.015,
        },
        '-=0.5',
      );

      tl.from(
        accentRef.current,
        {
          autoAlpha: 0,
          scale: 0.6,
          filter: 'blur(10px)',
          duration: 0.5,
          ease: 'back.out(2.5)',
        },
        '-=0.15',
      );
    }

    tl.from(
      subtitleRef.current,
      {
        clipPath: `inset(0 100% 0 0)`,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power3.inOut',
      },
      '-=0.5',
    );

    if (buttonsRef.current) {
      tl.from(buttonsRef.current, {
        autoAlpha: 0,
        duration: 0,
      });
      tl.from(
        buttonsRef.current.children,
        {
          scale: 0,
          autoAlpha: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1)',
        },
        '-=0.3',
      );
    }

    gsap.from(featuresTitleRef.current, {
      scrollTrigger: {
        trigger: featuresTitleRef.current,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
      y: 40,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power3.out',
    });

    gsap.from(featuresSubtitleRef.current, {
      scrollTrigger: {
        trigger: featuresSubtitleRef.current,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
      y: 20,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
    });

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      gsap.set(card, {
        transformPerspective: 900,
        transformOrigin: 'left center',
      });

      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
        rotateY: -55,
        x: -60,
        autoAlpha: 0,
        duration: 0.85,
        delay: (i % 3) * 0.12,
        ease: 'power4.out',
      });

      const onEnter = () =>
        gsap.to(card, {
          y: -10,
          scale: 1.03,
          boxShadow: '0 20px 40px rgba(99,102,241,0.3)',
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        });

      const onLeave = () =>
        gsap.to(card, {
          y: 0,
          scale: 1,
          boxShadow: 'none',
          duration: 0.4,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
    });
  });

  return {
    scrollArrowRef,
    featuresRef,
    titleRef,
    accentRef,
    subtitleRef,
    badgeRef,
    buttonsRef,
    cardsRef,
    featuresTitleRef,
    featuresSubtitleRef,
  };
};
