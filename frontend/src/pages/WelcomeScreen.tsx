import { InputForm } from "@/components/InputForm";

interface WelcomeScreenProps {
  handleSubmit: (
    submittedInputValue: string,
    effort: string,
    model: string,
    provider: string,
    temperature: number
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
}) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-4 flex-1 w-full max-w-[90%] mx-auto gap-4">
    <div>
      <h1 className="text-5xl md:text-6xl font-semibold text-foreground mb-3">
        Welcome.
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground">
        How can I help you today?
      </p>
    </div>
    <div className="w-full mt-4">
      <InputForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={onCancel}
        hasHistory={false}
      />
    </div>
    <p className="text-xs text-muted-foreground">
      Powered by DeepSeek, Google Gemini and LangChain LangGraph.
    </p>
  </div>
);
