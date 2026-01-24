import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onCoordinatesChange?: (coords: { lat: number; lng: number } | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showLocationButton?: boolean;
}

interface Suggestion {
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = "Enter your address",
  disabled = false,
  className,
  showLocationButton = false
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fetch mapbox token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!error && data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Error fetching mapbox token:', err);
      }
    };
    fetchToken();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (searchQuery: string) => {
    if (!mapboxToken || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=za&limit=5&types=address,place,locality,neighborhood`
      );
      const data = await response.json();
      
      if (data.features) {
        setSuggestions(
          data.features.map((feature: any) => ({
            place_name: feature.place_name,
            center: feature.center
          }))
        );
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    onCoordinatesChange?.(null);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.place_name);
    onChange(suggestion.place_name);
    onCoordinatesChange?.({
      lat: suggestion.center[1],
      lng: suggestion.center[0]
    });
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    setShowDropdown(false);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Wait for token if not yet loaded
      let token = mapboxToken;
      if (!token) {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!error && data?.token) {
          token = data.token;
          setMapboxToken(data.token);
        } else {
          console.error('Could not fetch mapbox token');
          // Fallback: set coordinates only
          onCoordinatesChange?.({ lat: latitude, lng: longitude });
          setGettingLocation(false);
          return;
        }
      }

      // Reverse geocode to get address - using broader types for better results
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=address,poi,place,locality,neighborhood&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        setQuery(address);
        onChange(address);
        onCoordinatesChange?.({ lat: latitude, lng: longitude });
      } else {
        // Fallback: try with fewer type restrictions
        const fallbackResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&limit=1`
        );
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.features && fallbackData.features.length > 0) {
          const address = fallbackData.features[0].place_name;
          setQuery(address);
          onChange(address);
          onCoordinatesChange?.({ lat: latitude, lng: longitude });
        } else {
          console.error('Could not reverse geocode location');
        }
      }
    } catch (error: any) {
      console.error('Error getting current location:', error);
      if (error.code === 1) {
        console.error('Location permission denied');
      } else if (error.code === 2) {
        console.error('Location unavailable');
      } else if (error.code === 3) {
        console.error('Location request timed out');
      }
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled || gettingLocation}
          className="pl-10 pr-10"
        />
        {(loading || gettingLocation) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" size={18} />
        )}
      </div>

      {/* External "Use current location" button */}
      {showLocationButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={gettingLocation || !mapboxToken}
          className="mt-2 w-full"
        >
          {gettingLocation ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Getting location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Use current location
            </>
          )}
        </Button>
      )}

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {/* Use Current Location */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border"
            disabled={gettingLocation}
          >
            <div className="p-2 rounded-full bg-primary/10">
              <Navigation className="text-primary" size={16} />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Use current location</p>
              <p className="text-xs text-muted-foreground">Get your GPS location</p>
            </div>
          </button>

          {/* Suggestions */}
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Searching addresses...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <MapPin className="text-muted-foreground shrink-0" size={16} />
                <span className="text-sm truncate">{suggestion.place_name}</span>
              </button>
            ))
          ) : query.length >= 3 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No addresses found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
