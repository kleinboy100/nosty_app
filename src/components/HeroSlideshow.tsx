import { useState, useEffect, useCallback, useRef } from 'react';
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startAutoPlay]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    startAutoPlay(); // Reset timer on manual navigation
  }, [startAutoPlay]);

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    startAutoPlay(); // Reset timer on manual navigation
  }, [startAutoPlay]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    startAutoPlay(); // Reset timer on manual navigation
  }, [startAutoPlay]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-500 ease-in-out",
            index === currentSlide 
              ? "opacity-100 z-0" 
              : "opacity-0 z-0"
          )}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Overlay - pointer-events-none so it doesn't block clicks */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/40 pointer-events-none z-10" />

      {/* Navigation Arrows - higher z-index */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToPrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-card/30 hover:bg-card/50 backdrop-blur-sm rounded-full p-2 transition-all text-card cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-card/30 hover:bg-card/50 backdrop-blur-sm rounded-full p-2 transition-all text-card cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator - higher z-index */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToSlide(index);
            }}
            className={cn(
              "h-2 rounded-full transition-all cursor-pointer",
              index === currentSlide 
                ? "bg-primary w-6" 
                : "bg-card/50 hover:bg-card/80 w-2"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
