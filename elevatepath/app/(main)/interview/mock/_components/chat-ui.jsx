"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ChatUI({ onStart, onSend, onEnd }) {
  const [sessionId, setSessionId] = useState(null);
  const [role, setRole] = useState("Product Manager");
  const [category, setCategory] = useState("Behavioral");
  const [messages, setMessages] = useState([]); // {sender:"AI"|"USER", text, feedback?}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const start = async () => {
    try {
      setLoading(true);
      const res = await onStart({ role, category });
      setSessionId(res.sessionId);
      setMessages([{ sender: "AI", text: res.question }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !sessionId) return;
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "USER", text: userText }]);
    setLoading(true);
    try {
      const ai = await onSend({ sessionId, message: userText });
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: ai.question, feedback: ai.feedback },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const end = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await onEnd({ sessionId });
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: "Session ended.", feedback: res.summary },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {!sessionId && (
        <div className="rounded-lg border p-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm font-medium">Role</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Product Manager" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm font-medium">Interview Type</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Behavioral">Behavioral</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end md:col-span-1">
            <Button onClick={start} disabled={loading}>Start Interview</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4 h-[480px] overflow-y-auto space-y-3" ref={listRef}>
        {messages.length === 0 && (
          <p className="text-muted-foreground">Start a session to begin the conversation.</p>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={m.sender === "AI" ? "text-left" : "text-right"}>
            <div className={
              "inline-block max-w-[80%] px-3 py-2 rounded-md " +
              (m.sender === "AI" ? "bg-muted" : "bg-primary text-primary-foreground")
            }>
              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
              {m.feedback && (
                <div className="mt-1 text-xs opacity-80 italic">Feedback: {m.feedback}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={sessionId ? "Type your answer..." : "Start a session first"}
          disabled={!sessionId || loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send} disabled={!sessionId || loading}>Send</Button>
        <Button onClick={end} variant="outline" disabled={!sessionId || loading}>End</Button>
      </div>
    </div>
  );
}

