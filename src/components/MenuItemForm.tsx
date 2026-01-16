import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export interface MenuItemData {
  name: string;
  description: string;
  price: string;
  category: string;
}

interface MenuItemFormProps {
  items: MenuItemData[];
  onChange: (items: MenuItemData[]) => void;
}

const categories = ['Mains', 'Sides', 'Drinks', 'Desserts', 'Combos', 'Specials'];

export function MenuItemForm({ items, onChange }: MenuItemFormProps) {
  const addItem = () => {
    onChange([...items, { name: '', description: '', price: '', category: 'Mains' }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof MenuItemData, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Menu Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus size={16} className="mr-1" /> Add Item
        </Button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-2">No menu items yet</p>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus size={16} className="mr-1" /> Add Your First Item
          </Button>
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input
                value={item.name}
                onChange={e => updateItem(index, 'name', e.target.value)}
                placeholder="e.g. Pap & Wors"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Price (ZAR) *</Label>
              <Input
                type="number"
                step="0.01"
                value={item.price}
                onChange={e => updateItem(index, 'price', e.target.value)}
                placeholder="45.00"
                required
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={item.description}
              onChange={e => updateItem(index, 'description', e.target.value)}
              placeholder="Describe this dish..."
              rows={2}
            />
          </div>
          
          <div>
            <Label className="text-xs">Category</Label>
            <select
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              value={item.category}
              onChange={e => updateItem(index, 'category', e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <Button type="button" variant="outline" className="w-full" onClick={addItem}>
          <Plus size={16} className="mr-2" /> Add Another Item
        </Button>
      )}
    </div>
  );
}
