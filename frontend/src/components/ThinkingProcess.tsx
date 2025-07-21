import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { memo, useState } from "react";
import { Brain, TrendingUp } from "lucide-react";
import { ThinkingMindMap } from "@/components/ThinkingMindMap";
import { UserBehaviorAnalysis } from "@/components/UserBehaviorAnalysis";
import { Message } from "@/models/Message";
import { UserProfile } from "@/models/UserProfile";

interface ThinkingProcessProps {
  messages: Message[];
  sessionId: string;
  userProfile: UserProfile | null;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

const ThinkingProcess = ({
  messages,
  sessionId,
  userProfile,
  visible,
  onVisibleChange,
}: ThinkingProcessProps) => {
  const [activeThinkingTab, setActiveThinkingTab] = useState("mindmap");
  return (
    <div className="w-[40%] bg-card border-l border-border">
      <Tabs
        value={activeThinkingTab}
        onValueChange={setActiveThinkingTab}
        className="h-full flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="mindmap" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Thinking Process
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            User Behavior Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mindmap" className="flex-1 m-0 p-0">
          <ThinkingMindMap
            messages={messages}
            isVisible={visible && activeThinkingTab === "mindmap"}
            onToggleVisibility={() => onVisibleChange(!visible)}
          />
        </TabsContent>

        <TabsContent value="behavior" className="flex-1 m-0 p-0">
          <UserBehaviorAnalysis
            messages={messages}
            sessionId={sessionId}
            userProfile={userProfile}
            onClose={() => onVisibleChange(false)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(ThinkingProcess);
