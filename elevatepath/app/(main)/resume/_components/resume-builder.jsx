"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resumeSchema } from "@/app/lib/schema";
import useFetch from "@/Hooks/use-fetch";
import { saveResume } from "@/actions/resume";
import { useUser } from "@clerk/nextjs";
import html2pdf from "html2pdf.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntryForm } from "./entry-form";

import { Save, Download, Edit, Monitor, AlertTriangle, Loader2 } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { toast } from "sonner";

const ResumeBuilder = ({ initialContent }) => {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent || "");
  const [resumeMode, setResumeMode] = useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useUser();

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const { loading: isSaving, fn: saveResumeFn, data: saveResult, error: saveError } = useFetch(saveResume);

  const formValues = watch();

  // Update previewContent when form values change
  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent || initialContent || "");
    }
  }, [formValues, activeTab]);

 

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin) parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user?.fullName || ""}</div>\n\n<div align="center">\n${parts.join(" | ")}\n</div>`
      : "";
  };

  const entriesToMarkdown = (entries, title) => {
    if (!entries?.length) return "";
    return `## ${title}\n\n${entries
      .map((entry) => `- **${entry.title}** | ${entry.company || ""}\n  - ${entry.description || ""}`)
      .join("\n")}`;
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      if (!element) return;

      const opt = {
        margin: [15, 15],
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };
   // Show toast on save
  useEffect(() => {
    if (saveResult && !isSaving) toast.success("Resume saved successfully!");
    if (saveError) toast.error(saveError?.message || "Failed to save resume");
  }, [saveResult, saveError, isSaving]);
  
  const onSubmit = async () => {
    if (!previewContent) return;

    try {
      const formattedContent = previewContent
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

      await saveResumeFn(formattedContent);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">Resume Builder</h1>
        <div className="space-x-2">
          <Button variant="destructive" onClick={onSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Markdown</TabsTrigger>
        </TabsList>

        {/* Edit Form */}
        <TabsContent value="edit">
          <form className="space-y-8">
            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="space-y-4">
                {["email", "mobile", "linkedin", "twitter"].map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <Input
                      {...register(`contactInfo.${field}`)}
                      type={field === "email" ? "email" : field === "mobile" ? "tel" : "url"}
                      placeholder={field === "email" ? "tanisha@email.com" : field === "mobile" ? "+91 xxxxx xxxxx" : `https://...`}
                    />
                    {errors.contactInfo?.[field] && (
                      <p className="text-sm text-red-500">{errors.contactInfo[field]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => <Textarea {...field} className="h-32" placeholder="Write a compelling professional summary..." />}
              />
              {errors.summary && <p className="text-sm text-red-500">{errors.summary.message}</p>}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => <Textarea {...field} className="h-32" placeholder="List your skills..." />}
              />
              {errors.skills && <p className="text-sm text-red-500">{errors.skills.message}</p>}
            </div>

            {/* Experience, Education, Projects */}
            {["experience", "education", "projects"].map((field) => (
              <div key={field} className="space-y-4">
                <h3 className="text-lg font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}</h3>
                <Controller
                  name={field}
                  control={control}
                  render={({ field: controllerField }) => (
                    <EntryForm type={field.charAt(0).toUpperCase() + field.slice(1, -1)} entries={controllerField.value} onChange={controllerField.onChange} />
                  )}
                />
                {errors[field] && <p className="text-sm text-red-500">{errors[field].message}</p>}
              </div>
            ))}
          </form>
        </TabsContent>

        {/* Markdown Preview */}
        <TabsContent value="preview">
          <Button
            variant="link"
            type="button"
            className="mb-2"
            onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")}
          >
            {resumeMode === "preview" ? (
              <>
                <Edit className="h-4 w-4" />
                Edit Resume
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>

          {resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">You will lose edited markdown if you update the form data.</span>
            </div>
          )}

          <div className="border rounded-lg">
            <MDEditor value={previewContent} onChange={setPreviewContent} height={800} preview={resumeMode} />
          </div>

          <div className="hidden">
            <div id="resume-pdf">
              <MDEditor.Markdown source={previewContent} style={{ background: "white", color: "black" }} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeBuilder;
