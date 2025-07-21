import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Save,
  Plus,
  X,
  Briefcase,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import { UserProfile } from "@/models/UserProfile";

// TagInput component defined outside to prevent re-creation on each render
const TagInput = ({
  label,
  items,
  newValue,
  setNewValue,
  onAddItem,
  onRemoveItem,
  placeholder,
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
          if (e.key === "Enter") {
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
        <Badge
          key={index}
          variant="secondary"
          className="flex items-center gap-1"
        >
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

interface ProfilePageProps {
  editProfile?: UserProfile | null;
  onBack?: () => void;
}

export function ProfilePage({ editProfile, onBack }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    background: "",
    role: "",
    experience_level: "intermediate",
    skills: [],
    keywords: [],
    interests: [],
    preferred_communication_style: "detailed",
    goals: "",
    current_projects: [],
    learning_objectives: [],
    created_at: "",
    updated_at: "",
    id: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newObjective, setNewObjective] = useState("");

  // Load profile data when component mounts or editProfile changes
  useEffect(() => {
    if (editProfile) {
      // Editing existing profile - load the passed profile data
      setProfile({
        id: editProfile.id,
        name: editProfile.name || "",
        background: editProfile.background || "",
        role: editProfile.role || "",
        experience_level: editProfile.experience_level || "intermediate",
        skills: editProfile.skills || [],
        keywords: editProfile.keywords || [],
        interests: editProfile.interests || [],
        preferred_communication_style:
          editProfile.preferred_communication_style || "detailed",
        goals: editProfile.goals || "",
        current_projects: editProfile.current_projects || [],
        learning_objectives: editProfile.learning_objectives || [],
        created_at: editProfile.created_at,
        updated_at: editProfile.updated_at,
      });
    } else {
      // Creating new profile - try to load default profile as template
      loadDefaultProfile();
    }
  }, [editProfile]);

  const loadDefaultProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiUrl("ai_chat", "profile")}/default`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      }
    } catch (error) {
      console.error("Failed to load default profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const profileData = {
        ...profile,
        skills: profile.skills.join(", "),
        keywords: profile.keywords.join(", "),
        interests: profile.interests.join(", "),
        current_projects: profile.current_projects.join(", "),
        learning_objectives: profile.learning_objectives.join(", "),
      };

      const url = profile.id
        ? `${getApiUrl("ai_chat", "profile")}/${profile.id}`
        : `${getApiUrl("ai_chat", "profile")}`;

      const method = profile.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          setMessage({ type: "success", text: "Profile saved successfully!" });

          // If editing and onBack is provided, go back after a short delay
          if (editProfile && onBack) {
            setTimeout(() => {
              onBack();
            }, 1500);
          }
        }
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage({
        type: "error",
        text: "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (
    type:
      | "skills"
      | "keywords"
      | "interests"
      | "current_projects"
      | "learning_objectives",
    value: string
  ) => {
    if (value.trim()) {
      setProfile((prev) => ({
        ...prev,
        [type]: [...prev[type], value.trim()],
      }));

      // Clear the input
      switch (type) {
        case "skills":
          setNewSkill("");
          break;
        case "keywords":
          setNewKeyword("");
          break;
        case "interests":
          setNewInterest("");
          break;
        case "current_projects":
          setNewProject("");
          break;
        case "learning_objectives":
          setNewObjective("");
          break;
      }
    }
  };

  const removeItem = (
    type:
      | "skills"
      | "keywords"
      | "interests"
      | "current_projects"
      | "learning_objectives",
    index: number
  ) => {
    setProfile((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create your profile to help AI provide more personalized and
            accurate responses
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <div
              className={`p-3 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Basic Information
              </h3>

              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role/Title</label>
                <Input
                  value={profile.role}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, role: e.target.value }))
                  }
                  placeholder="e.g., Software Developer, Student, Designer"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Experience Level</label>
                <Select
                  value={profile.experience_level}
                  onValueChange={(value) =>
                    setProfile((prev) => ({ ...prev, experience_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Communication Style
                </label>
                <Select
                  value={profile.preferred_communication_style}
                  onValueChange={(value) =>
                    setProfile((prev) => ({
                      ...prev,
                      preferred_communication_style: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed">
                      Detailed explanations
                    </SelectItem>
                    <SelectItem value="concise">Concise and direct</SelectItem>
                    <SelectItem value="technical">
                      Technical and precise
                    </SelectItem>
                    <SelectItem value="beginner-friendly">
                      Beginner-friendly
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Background and Goals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Background & Goals
              </h3>

              <div>
                <label className="text-sm font-medium">Background</label>
                <Textarea
                  value={profile.background}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      background: e.target.value,
                    }))
                  }
                  placeholder="Tell us about your background, education, work experience..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Goals</label>
                <Textarea
                  value={profile.goals}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, goals: e.target.value }))
                  }
                  placeholder="What are your current goals or what do you want to achieve?"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Skills and Interests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Skills & Interests
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagInput
                label="Skills"
                items={profile.skills}
                newValue={newSkill}
                setNewValue={setNewSkill}
                onAddItem={() => addItem("skills", newSkill)}
                onRemoveItem={(index) => removeItem("skills", index)}
                placeholder="Add a skill (e.g., JavaScript, Python)"
              />

              <TagInput
                label="Keywords"
                items={profile.keywords}
                newValue={newKeyword}
                setNewValue={setNewKeyword}
                onAddItem={() => addItem("keywords", newKeyword)}
                onRemoveItem={(index) => removeItem("keywords", index)}
                placeholder="Add keywords (e.g., web development, AI)"
              />

              <TagInput
                label="Interests"
                items={profile.interests}
                newValue={newInterest}
                setNewValue={setNewInterest}
                onAddItem={() => addItem("interests", newInterest)}
                onRemoveItem={(index) => removeItem("interests", index)}
                placeholder="Add an interest (e.g., machine learning)"
              />

              <TagInput
                label="Current Projects"
                items={profile.current_projects}
                newValue={newProject}
                setNewValue={setNewProject}
                onAddItem={() => addItem("current_projects", newProject)}
                onRemoveItem={(index) => removeItem("current_projects", index)}
                placeholder="Add a current project"
              />
            </div>

            <TagInput
              label="Learning Objectives"
              items={profile.learning_objectives}
              newValue={newObjective}
              setNewValue={setNewObjective}
              onAddItem={() => addItem("learning_objectives", newObjective)}
              onRemoveItem={(index) => removeItem("learning_objectives", index)}
              placeholder="What do you want to learn? (e.g., React, Docker)"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={saveProfile}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
