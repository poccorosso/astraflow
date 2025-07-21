"""
User Profile Manager
Manages user profiles including background, skills, keywords, and preferences
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class UserProfile:
    """User profile data structure"""
    id: str
    name: str
    background: str
    role: str
    experience_level: str  # beginner, intermediate, advanced, expert
    skills: List[str]
    keywords: List[str]
    interests: List[str]
    preferred_communication_style: str  # detailed, concise, technical, beginner-friendly
    goals: str
    current_projects: List[str]
    learning_objectives: List[str]
    created_at: str
    updated_at: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserProfile':
        """Create profile from dictionary"""
        return cls(**data)

class ProfileManager:
    """Manages user profiles with file-based storage"""
    
    def __init__(self, storage_path: str = "data/user_profiles.json"):
        self.storage_path = Path(storage_path)
        self.profiles: Dict[str, UserProfile] = {}
        self.load_profiles()
    
    def load_profiles(self):
        """Load profiles from storage file"""
        try:
            if self.storage_path.exists():
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.profiles = {
                        profile_id: UserProfile.from_dict(profile_data)
                        for profile_id, profile_data in data.items()
                    }
                print(f"[PROFILE] Loaded {len(self.profiles)} profiles")
            else:
                print("[PROFILE] No existing profiles file, starting fresh")
        except Exception as e:
            print(f"[ERROR] Failed to load profiles: {e}")
            self.profiles = {}
    
    def save_profiles(self):
        """Save profiles to storage file"""
        try:
            # Ensure directory exists
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Convert profiles to dict format
            data = {
                profile_id: profile.to_dict()
                for profile_id, profile in self.profiles.items()
            }
            
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            print(f"[PROFILE] Saved {len(self.profiles)} profiles")
        except Exception as e:
            print(f"[ERROR] Failed to save profiles: {e}")
    
    def create_profile(self, profile_data: Dict[str, Any]) -> str:
        """Create a new user profile"""
        profile_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        # Set default values and timestamps
        profile_data.update({
            'id': profile_id,
            'created_at': now,
            'updated_at': now
        })
        
        # Ensure lists are properly formatted
        list_fields = ['skills', 'keywords', 'interests', 'current_projects', 'learning_objectives']
        for field in list_fields:
            if field not in profile_data:
                profile_data[field] = []
            elif isinstance(profile_data[field], str):
                # Convert comma-separated string to list
                profile_data[field] = [item.strip() for item in profile_data[field].split(',') if item.strip()]
        
        # Set default values for required fields
        defaults = {
            'name': 'Anonymous User',
            'background': '',
            'role': '',
            'experience_level': 'intermediate',
            'preferred_communication_style': 'detailed',
            'goals': '',
        }
        
        for key, default_value in defaults.items():
            if key not in profile_data or not profile_data[key]:
                profile_data[key] = default_value
        
        profile = UserProfile.from_dict(profile_data)
        self.profiles[profile_id] = profile
        self.save_profiles()
        
        print(f"[PROFILE] Created profile {profile_id} for {profile.name}")
        return profile_id
    
    def get_profile(self, profile_id: str) -> Optional[UserProfile]:
        """Get a profile by ID"""
        return self.profiles.get(profile_id)
    
    def update_profile(self, profile_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing profile"""
        if profile_id not in self.profiles:
            return False
        
        profile = self.profiles[profile_id]
        
        # Update timestamp
        updates['updated_at'] = datetime.now().isoformat()
        
        # Handle list fields
        list_fields = ['skills', 'keywords', 'interests', 'current_projects', 'learning_objectives']
        for field in list_fields:
            if field in updates and isinstance(updates[field], str):
                updates[field] = [item.strip() for item in updates[field].split(',') if item.strip()]
        
        # Update profile data
        profile_dict = profile.to_dict()
        profile_dict.update(updates)
        
        self.profiles[profile_id] = UserProfile.from_dict(profile_dict)
        self.save_profiles()
        
        print(f"[PROFILE] Updated profile {profile_id}")
        return True
    
    def delete_profile(self, profile_id: str) -> bool:
        """Delete a profile"""
        if profile_id in self.profiles:
            del self.profiles[profile_id]
            self.save_profiles()
            print(f"[PROFILE] Deleted profile {profile_id}")
            return True
        return False
    
    def list_profiles(self) -> List[Dict[str, Any]]:
        """List all profiles (summary view)"""
        return [
            {
                'id': profile.id,
                'name': profile.name,
                'role': profile.role,
                'experience_level': profile.experience_level,
                'created_at': profile.created_at,
                'updated_at': profile.updated_at
            }
            for profile in self.profiles.values()
        ]
    
    def get_default_profile(self) -> Optional[UserProfile]:
        """Get the first available profile (for single-user scenarios)"""
        if self.profiles:
            return next(iter(self.profiles.values()))
        return None
    
    def generate_profile_context(self, profile_id: str) -> str:
        """Generate context string for AI conversations"""
        profile = self.get_profile(profile_id)
        if not profile:
            return ""
        
        context_parts = []
        
        if profile.name and profile.name != 'Anonymous User':
            context_parts.append(f"User: {profile.name}")
        
        if profile.role:
            context_parts.append(f"Role: {profile.role}")
        
        if profile.experience_level:
            context_parts.append(f"Experience Level: {profile.experience_level}")
        
        if profile.background:
            context_parts.append(f"Background: {profile.background}")
        
        if profile.skills:
            context_parts.append(f"Skills: {', '.join(profile.skills)}")
        
        if profile.interests:
            context_parts.append(f"Interests: {', '.join(profile.interests)}")
        
        if profile.current_projects:
            context_parts.append(f"Current Projects: {', '.join(profile.current_projects)}")
        
        if profile.learning_objectives:
            context_parts.append(f"Learning Goals: {', '.join(profile.learning_objectives)}")
        
        if profile.goals:
            context_parts.append(f"Goals: {profile.goals}")
        
        if profile.preferred_communication_style:
            context_parts.append(f"Preferred Communication: {profile.preferred_communication_style}")
        
        if context_parts:
            return "User Profile:\n" + "\n".join(f"- {part}" for part in context_parts) + "\n\n"
        
        return ""

# Global profile manager instance
profile_manager = ProfileManager()
