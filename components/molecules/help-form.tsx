"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle2 } from "lucide-react";
import { H3, P, Small } from "@/components/atoms/typography";

export function HelpForm() {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 🔌 TODO: Implement actual API call to submit help request
    // For now, just simulate a submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ subject: "", message: "" });

      // Reset success message after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border py-6 shadow-sm">
      <div className="px-6">
        <H3>Need Help?</H3>
        <Small className="text-muted-foreground mt-1">
          Send us a message and we'll get back to you as soon as possible.
        </Small>
      </div>
      {isSubmitted ? (
        <div className="flex flex-col items-center justify-center py-8 text-center px-6">
          <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
          <P className="font-medium mb-1">Message sent!</P>
          <Small className="text-muted-foreground">
            We'll get back to you soon.
          </Small>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 px-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What can we help you with?"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Tell us more about your question or issue..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4  " />
                Send Message
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
