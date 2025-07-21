import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProfileList } from "@/pages/ProfileList";
import { ProfilePage } from "@/pages/ProfilePage";
import { UserProfile } from "@/models/UserProfile";

type ViewMode = 'list' | 'create' | 'edit';

export function ProfileManager() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const handleCreateNew = () => {
    setEditingProfile(null);
    setViewMode('create');
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setViewMode('edit');
  };

  const handleBack = () => {
    setEditingProfile(null);
    setViewMode('list');
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <ProfileList
            onCreateNew={handleCreateNew}
            onEditProfile={handleEditProfile}
          />
        );
      
      case 'create':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Profiles
              </Button>
              <h1 className="text-2xl font-bold">Create New Profile</h1>
            </div>
            <ProfilePage onBack={handleBack} />
          </div>
        );
      
      case 'edit':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Profiles
              </Button>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
            </div>
            <ProfilePage editProfile={editingProfile} onBack={handleBack} />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {renderContent()}
    </div>
  );
}
