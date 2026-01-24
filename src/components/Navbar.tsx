import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Store, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold gradient-text">KasiConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Restaurants
            </Link>
            {user && (
              <>
                <Link 
                  to="/orders" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1"
                >
                  <ClipboardList size={18} />
                  My Orders
                </Link>
                <Link 
                  to="/restaurant/dashboard" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1"
                >
                  <Store size={18} />
                  Restaurant Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User size={20} />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut size={20} />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button className="btn-primary">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile: Only show logout button if logged in */}
          <div className="md:hidden">
            {user && (
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
