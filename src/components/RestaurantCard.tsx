import { Link } from 'react-router-dom';
import { Clock, Star, MapPin } from 'lucide-react';

interface RestaurantCardProps {
  id: string;
  name: string;
  description: string | null;
  cuisineType: string;
  address: string;
  imageUrl: string | null;
  rating: number;
  averagePrepTime: number;
}

export function RestaurantCard({
  id,
  name,
  description,
  cuisineType,
  address,
  imageUrl,
  rating,
  averagePrepTime
}: RestaurantCardProps) {
  return (
    <Link to={`/restaurant/${id}`} className="block">
      <article className="card-elevated overflow-hidden group">
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
            <Star size={14} className="text-accent fill-accent" />
            <span className="text-sm font-medium">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-medium">
              {cuisineType}
            </span>
          </div>
          {description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{averagePrepTime} min</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="truncate max-w-[150px]">{address}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
