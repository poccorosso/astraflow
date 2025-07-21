import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Users,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import { UserProfile } from "@/models/UserProfile";

interface ProfileListProps {
  onCreateNew: () => void;
  onEditProfile: (profile: UserProfile) => void;
  onSelectProfile?: (profileId: string) => void;
  selectedProfileId?: string;
  showSelection?: boolean;
}

export function ProfileList({ 
  onCreateNew, 
  onEditProfile, 
  onSelectProfile, 
  selectedProfileId,
  showSelection = false 
}: ProfileListProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiUrl("ai_chat", "profiles")}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Load full profile data for each profile
          const fullProfiles = await Promise.all(
            data.profiles.map(async (profileSummary: any) => {
              try {
                const profileResponse = await fetch(
                  `${getApiUrl("ai_chat", "profile")}/${profileSummary.id}`
                );
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  return profileData.profile;
                }
                return profileSummary;
              } catch (error) {
                console.error(`Failed to load profile ${profileSummary.id}:`, error);
                return profileSummary;
              }
            })
          );
          setProfiles(fullProfiles);
        }
      } else {
        throw new Error('Failed to load profiles');
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
      setError("Failed to load profiles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    try {
      const response = await fetch(
        `${getApiUrl("ai_chat", "profile")}/${profileId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setProfiles(profiles.filter(p => p.id !== profileId));
      } else {
        throw new Error('Failed to delete profile');
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
      alert("Failed to delete profile. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadProfiles} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="text-xl font-semibold">User Profiles</h2>
          <Badge variant="secondary">{profiles.length}</Badge>
        </div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No profiles yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first profile to get personalized AI responses
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card 
              key={profile.id} 
              className={`transition-all hover:shadow-md ${
                showSelection && selectedProfileId === profile.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {profile.name || 'Unnamed Profile'}
                    </CardTitle>
                    {profile.role && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Briefcase className="w-3 h-3" />
                        {profile.role}
                      </div>
                    )}
                  </div>
                  <Badge className={getExperienceBadgeColor(profile.experience_level)}>
                    {profile.experience_level}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {profile.background && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile.background}
                  </p>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <GraduationCap className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {profile.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {profile.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(profile.created_at)}
                </div>

                <div className="flex gap-2 pt-2">
                  {showSelection && onSelectProfile && (
                    <Button
                      size="sm"
                      variant={selectedProfileId === profile.id ? "default" : "outline"}
                      onClick={() => onSelectProfile(profile.id)}
                      className="flex-1"
                    >
                      {selectedProfileId === profile.id ? "Selected" : "Select"}
                    </Button>
                  )}
                  
                  {!showSelection && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditProfile(profile)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProfile(profile.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
