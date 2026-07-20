import { PageHeader } from "@/components/page-header";
import { AnalystChat } from "@/components/analyst-chat";

export const metadata = {
  title: "AI Analyst — F3 Intelligence",
};

export default function AssistantPage() {
  return (
    <div>
      <PageHeader
        title="AI Analyst"
        description="Ask questions in plain language — it computes stats and math over your live dashboard data"
      />
      <AnalystChat />
    </div>
  );
}
