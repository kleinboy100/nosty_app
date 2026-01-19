import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormProps {
  restaurantId: string;
  orderId?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ restaurantId, orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to leave a review.",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        order_id: orderId || null,
        rating,
        comment: comment.trim() || null
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already reviewed",
            description: "You have already reviewed this order.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback."
      });
      setRating(0);
      setComment('');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
        </span>
      </div>

      <Textarea
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      <Button onClick={handleSubmit} disabled={loading || rating === 0}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </div>
  );
}
