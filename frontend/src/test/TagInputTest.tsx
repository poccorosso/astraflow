import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

// Test component to verify TagInput focus behavior
const TagInput = ({ 
  label, 
  items, 
  newValue, 
  setNewValue, 
  onAddItem,
  onRemoveItem,
  placeholder 
}: {
  label: string;
  items: string[];
  newValue: string;
  setNewValue: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  placeholder: string;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{label}</label>
    <div className="flex gap-2">
      <Input
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        placeholder={placeholder}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAddItem();
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddItem}
        disabled={!newValue.trim()}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Badge key={index} variant="secondary" className="flex items-center gap-1">
          {item}
          <button
            onClick={() => onRemoveItem(index)}
            className="ml-1 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
    </div>
  </div>
);

export function TagInputTest() {
  const [skills, setSkills] = useState<string[]>(['JavaScript', 'React']);
  const [newSkill, setNewSkill] = useState('');
  const [renderCount, setRenderCount] = useState(0);

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const forceRerender = () => {
    setRenderCount(prev => prev + 1);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">TagInput Focus Test</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test that the input field maintains focus while typing. 
          Render count: {renderCount}
        </p>
        
        <div className="space-y-4">
          <TagInput
            label="Skills (Fixed Version)"
            items={skills}
            newValue={newSkill}
            setNewValue={setNewSkill}
            onAddItem={addSkill}
            onRemoveItem={removeSkill}
            placeholder="Type a skill and press Enter or click +"
          />
          
          <div className="flex gap-2">
            <Button onClick={forceRerender} variant="outline" size="sm">
              Force Re-render (Test Focus)
            </Button>
            <Button 
              onClick={() => setSkills([])} 
              variant="outline" 
              size="sm"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">✅ Expected Behavior:</h3>
        <ul className="text-sm space-y-1">
          <li>• Input field should maintain focus while typing</li>
          <li>• Pressing Enter should add the item and clear input</li>
          <li>• Input should remain focused after adding items</li>
          <li>• Force re-render should not break input focus</li>
        </ul>
      </div>

      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">❌ Previous Problem:</h3>
        <ul className="text-sm space-y-1">
          <li>• Input would lose focus after typing each character</li>
          <li>• TagInput component was recreated on each render</li>
          <li>• React would unmount and remount the input element</li>
        </ul>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">🔧 Fix Applied:</h3>
        <ul className="text-sm space-y-1">
          <li>• Moved TagInput component outside of ProfilePage</li>
          <li>• Component is now stable across re-renders</li>
          <li>• Input element maintains its identity and focus</li>
        </ul>
      </div>
    </div>
  );
}
