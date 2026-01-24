import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200',
    title: 'Kasi Burgers',
    subtitle: 'Flame-grilled perfection'
  },
  {
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200',
    title: 'Braai & Grill',
    subtitle: 'Authentic South African BBQ'
  },
  {
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=1200',
    title: 'Bunny Chow',
    subtitle: 'Durban\'s finest street food'
  },
  {
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    title: 'Traditional Dishes',
    subtitle: 'Home-cooked Mzansi flavors'
  },
  {
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=1200',
    title: 'Shisanyama',
    subtitle: 'The best township meat experience'
  }
];

export function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-in-out",
            index === currentSlide 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-105"
          )}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/40" />
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-card/30 hover:bg-card/50 backdrop-blur-sm rounded-full p-2 transition-all text-card"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-card/30 hover:bg-card/50 backdrop-blur-sm rounded-full p-2 transition-all text-card"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentSlide 
                ? "bg-primary w-6" 
                : "bg-card/50 hover:bg-card/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}