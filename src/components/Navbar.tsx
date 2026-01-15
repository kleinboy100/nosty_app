import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Store, ClipboardList, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold gradient-text">FoodFlow</span>
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

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link 
                to="/" 
                className="text-foreground font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Restaurants
              </Link>
              {user && (
                <>
                  <Link 
                    to="/orders" 
                    className="text-foreground font-medium py-2 flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ClipboardList size={18} />
                    My Orders
                  </Link>
                  <Link 
                    to="/restaurant/dashboard" 
                    className="text-foreground font-medium py-2 flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Store size={18} />
                    Restaurant Dashboard
                  </Link>
                </>
              )}
              <Link 
                to="/cart" 
                className="text-foreground font-medium py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart size={18} />
                Cart {itemCount > 0 && `(${itemCount})`}
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/profile" 
                    className="text-foreground font-medium py-2 flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                  <button 
                    className="text-foreground font-medium py-2 flex items-center gap-2 text-left"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="btn-primary w-full">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
