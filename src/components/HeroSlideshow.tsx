import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
}

interface HeroSlideshowProps {
  menuItems: MenuItem[];
}

export function HeroSlideshow({ menuItems }: HeroSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use menu items if available, otherwise use fallback
  const slides = menuItems.length > 0 
    ? menuItems.slice(0, 5).map(item => ({
        image: item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
        title: item.name,
        subtitle: item.description || item.category,
        price: item.price
      }))
    : [
        { image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200', title: 'Delicious Meals', subtitle: 'Fresh & Fast', price: 0 }
      ];

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, [slides.length]);

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
    startAutoPlay();
  }, [startAutoPlay, slides.length]);

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    startAutoPlay();
  }, [startAutoPlay, slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    startAutoPlay();
  }, [startAutoPlay]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-r from-foreground/90 to-foreground/70">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-500 ease-in-out flex",
            index === currentSlide 
              ? "opacity-100 z-0" 
              : "opacity-0 z-0"
          )}
        >
          {/* Left side - Text content */}
          <div className="flex-1 flex flex-col justify-center px-6 md:px-12 z-10">
            <div className="max-w-md">
              <h2 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-card mb-1 line-clamp-2">
                {slide.title}
              </h2>
              <p className="text-card/80 text-sm md:text-base line-clamp-2 mb-2">
                {slide.subtitle}
              </p>
              {slide.price > 0 && (
                <span className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                  R{slide.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          
          {/* Right side - Image */}
          <div className="w-1/2 md:w-2/5 relative flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-[200px] max-h-[200px] md:max-w-[240px] md:max-h-[240px]">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToPrev();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-card/30 hover:bg-card/50 backdrop-blur-sm rounded-full p-1.5 transition-all text-card cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToNext();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-card/30 hover:bg-card/50 backdrop-blur-sm rounded-full p-1.5 transition-all text-card cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
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
              "h-1.5 rounded-full transition-all cursor-pointer",
              index === currentSlide 
                ? "bg-primary w-5" 
                : "bg-card/50 hover:bg-card/80 w-1.5"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
