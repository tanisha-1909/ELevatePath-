import ChatUI from "./_components/chat-ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { startMockInterview, sendMockInterviewMessage, endMockInterview } from "@/actions/interview";

export const metadata = {
  title: "Live Mock Interview | ElevatePath",
};

const LiveMockInterviewPage = async () => {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col space-y-2 mx-2">
        <Link href={'/interview'}>
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Interview Preparation
          </Button>
        </Link>

        <div>
          <h1 className="text-6xl font-bold gradient-title">Live Mock Interview</h1>
          <p className="text-muted-foreground">Practice a live, multi-turn interview with AI. Choose a role and interview type to get started.</p>
        </div>
      </div>

      <ChatUI onStart={startMockInterview} onSend={sendMockInterviewMessage} onEnd={endMockInterview} />
    </div>
  );
}

export default LiveMockInterviewPage;

