import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Settings } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { UserProfile } from "@/models/UserProfile";

interface ProfileSelectorProps {
  selectedProfileId: string | null;
  onProfileChange: (profile: UserProfile | null) => void;
  onManageProfiles?: () => void;
  selectedProfile: UserProfile| null;
}

const ProfileSelector=({
  selectedProfileId,
  onProfileChange,
  onManageProfiles,
  selectedProfile,
}: ProfileSelectorProps)=> {
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(
    selectedProfileId
  );
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    loadProfiles();
  }, []);

  // Load profile details when profileId changes
  useEffect(() => {
    const loadProfileDetails = async () => {
      if (!currentProfileId) {
        onProfileChange(null);
        return;
      }

      try {
        const response = await fetch(
          `${getApiUrl("ai_chat", "profile")}${currentProfileId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.profile) {
            onProfileChange(data.profile);
          }
        }
      } catch (error) {
        console.error("Failed to load profile details:", error);
      }
    };

    loadProfileDetails();
  }, [currentProfileId]);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl("ai_chat", "profiles")}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfiles(data.profiles);

          // If no profile is selected but profiles exist, select the first one
          if (!selectedProfileId && data.profiles.length > 0) {
            const profile = data.profiles[0];
            setCurrentProfileId(profile.id);
            onProfileChange(profile);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    if (profileId === "none") {
      setCurrentProfileId(null);
    } else {
      setCurrentProfileId(profileId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="w-4 h-4" />
        <span>Profile:</span>
      </div>
      <Select
        value={currentProfileId || "none"}
        onValueChange={handleProfileSelect}
        disabled={isLoading}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select profile">
            {selectedProfile ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedProfile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({selectedProfile.experience_level})
                </span>
              </div>
            ) : (
              "No profile"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <span>No profile</span>
              <span className="text-xs text-muted-foreground">
                (Generic responses)
              </span>
            </div>
          </SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{profile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {profile.role && `${profile.role} • `}
                  {profile.experience_level}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onManageProfiles && (
        <Button
          variant="outline"
          size="sm"
          onClick={onManageProfiles}
          className="flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          Manage
        </Button>
      )}
    </div>
  );
}

export default memo(ProfileSelector);