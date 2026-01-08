"use client"

import { improveWithAI, saveResume } from '@/actions/resume'
import { resumeSchema } from '@/app/lib/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import useFetch from '@/hooks/use-fetch'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Download, Edit, Loader2, Monitor, Save, Sparkles } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import EntryForm from './entry-form'
import { toast } from 'sonner'
import { entriesToMarkdown } from '@/app/lib/helper'
import MDEditor from '@uiw/react-md-editor'
import { useUser } from '@clerk/nextjs'





const ResumeBuilder = ({initialContent}) => {
    const [activeTab, setActiveTab] = useState("edit")
    const [resumeMode, setResumeMode] = useState("preview");
    const [previewContent, setPreviewContent] = useState(initialContent);
    const { user } = useUser();
    const [isGenerating, setIsGenerating] = useState(false);

    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: {errors},
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

    const {
        loading: isSaving,
        fn: saveResumeFn,
        data: saveResult,
        error: saveError,
    } = useFetch(saveResume);

    const [isImprovingField, setIsImprovingField] = useState(null);

    const {
        loading: isImproving,
        fn: improveWithAIFn,
        data: improvedContent,
        error: improveError,
    } = useFetch(improveWithAI);


    useEffect(() => {
        if (improvedContent && !isImproving && isImprovingField){
            setValue(isImprovingField, improvedContent);
            const temp = isImprovingField.charAt(0).toUpperCase() + isImprovingField.slice(1);
            toast.success(`${temp} improved successfully!`);
            setIsImprovingField(null);
        }

        

    }, [improvedContent, isImprovingField, isImproving, setValue])


    useEffect(() => {
        if (improveError){
            toast.error(improveError.message || "Failed to improve skills")
        }
        setIsImprovingField(null);
    }, [improveError])

    
    const handleImproveSummary = async () => {
        const summary = watch("summary");
        if (!summary){
            toast.error("Please enter a summary first");
            return;
        }

        setIsImprovingField("summary");
        await improveWithAIFn({
            current: summary,
            type: "summary",
        });
    }
    
    const handleImproveSkills = async () => {
        const skills = watch("skills");
        if (!skills){
            toast.error("Please enter skills first");
            return;
        }

        setIsImprovingField("skills");

        await improveWithAIFn({
            current: skills,
            type: "skills",
        });
    }
    


    const formValues = watch();

    useEffect(() => {
        if (initialContent) setActiveTab("preview");
    }, [initialContent]);

    const getContactMarkdown = () => {
        const {contactInfo} = formValues;
        const parts = [];
        if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
        if (contactInfo.mobile) parts.push(`📞 ${contactInfo.mobile}`);
        if (contactInfo.Linkedin) parts.push(`💼 ${contactInfo.Linkedin}`);
        if (contactInfo.X) parts.push(`💬 ${contactInfo.X}`);
        
        return parts.length > 0
        ? `## <div align="center">${user.fullName}</div>
        \n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
        : "";
    };
        
    useEffect(() => {
        if (activeTab === "edit") {
            const newContent = getCombinedContent();
            setPreviewContent(newContent ? newContent : initialContent)
        }
    }, [formValues, activeTab])
        
   
    const getCombinedContent= () => {
        const {summary, skills, experience, education, projects } = formValues;

        return [
            getContactMarkdown(),
            summary && `## Professional Summary\n\n${summary}`,
            skills && `## Skills\n\n${skills}`,
            entriesToMarkdown(experience, "Work Experience"),
            entriesToMarkdown(education, "Education"),
            entriesToMarkdown(projects, "Projects"),
        ].filter(Boolean)
        .join("\n\n");
    };

    useEffect(() => {
        if (saveResult && !isSaving){
            toast.success("Resume saved successfully!")
        }
        if (saveError){
            toast.error(saveError.message || "Failed to save resume");
        }
    }, [saveResult, saveError, isSaving]);

    const onSubmit = async (data) => {
        try {
            await saveResumeFn(previewContent);
        } catch (error){
            console.error("Save error", error);
        }
    };

   const generatePDF = async () => {
  setIsGenerating(true);
  try {
    const element = document.getElementById("resume-pdf");
    if (!element) {
      toast.error("Resume element not found");
      return;
    }

    // 1. Import html2pdf and the PRO version of canvas
    const html2pdf = (await import("html2pdf.js")).default;
    const html2canvasPro = (await import("html2canvas-pro")).default;

    const opt = {
      margin: [15, 15],
      filename: "resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      // 2. Pass the pro version into the html2canvas configuration
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        canvas: null, 
        imgTimeout: 15000,
        // This is where the magic happens
        html2canvas: html2canvasPro 
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("PDF generation error:", error);
    toast.error("Failed to generate PDF");
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <h1 className='font-bold gradient-title text-5xl md:text-6xl'>
                Resume Builder
            </h1>

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="edit">Form</TabsTrigger>
    <TabsTrigger value="preview">Markdown</TabsTrigger>
  </TabsList>
  <TabsContent value="edit">
    <form className="space-y-8" >
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    error={errors.contactInfo?.email}
                    />

                    {errors.contactInfo?.email && (
                        <p className="text-sm text-red-500">
                            {errors.contactInfo.email.message}
                        </p>
                    )}
            </div>


            <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                    error={errors.contactInfo?.mobile}
                    />

                    {errors.contactInfo?.mobile && (
                        <p className="text-sm text-red-500">
                            {errors.contactInfo.mobile.message}
                        </p>
                    )}
            </div>


            <div className="space-y-2">
                <label className="text-sm font-medium">Linkedin URL</label>
                <Input
                    {...register("contactInfo.Linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    error={errors.contactInfo?.Linkedin}
                    />

                    {errors.contactInfo?.Linkedin && (
                        <p className="text-sm text-red-500">
                            {errors.contactInfo.Linkedin.message}
                        </p>
                    )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Twitter/X profile</label>
                <Input
                    {...register("contactInfo.X")}
                    type="url"
                    placeholder="https://X.com/your-handle"
                    error={errors.contactInfo?.X}
                    />

                    {errors.contactInfo?.X && (
                        <p className="text-sm text-red-500">
                            {errors.contactInfo.X.message}
                        </p>
                    )}
            </div>
        </div>
        </div>

        <div className="space-y-4">
        <h3 className="text-lg font-medium">Professional Summary</h3>
        <Controller
            name="summary"
            control={control}
            render={({field}) => (
                <Textarea
                {...field}
                className="h-32"
                placeholder="Write a compelling professional summary..."
                error={errors.summary}
                />
                
            )}
            
            />

             <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleImproveSummary}
        disabled={isImproving || !watch("summary")}
        >
            {isImproving && isImprovingField === "summary" ? (
                <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Improving...
                </>
            ) : (
                <>
                <Sparkles className="h-4 w-4 mr-2" />
                Improve with AI
                </>
            )}
        </Button>

            {errors.summary && (
                <p className="text-sm text-red-500">
                    {errors.summary.message}
                </p>
            )}
    </div>

    <div className="space-y-4">
        <h3 className="text-lg font-medium">Skills</h3>
        <Controller
            name="skills"
            control={control}
            render={({field}) => (
                <Textarea
                {...field}
                className="h-32"
                placeholder="List your key skills..."
                error={errors.skills}
                />
            )}
            
            />

        <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleImproveSkills}
        disabled={isImproving || !watch("skills")}
        >
            {isImproving && isImprovingField === "skills" ? (
                <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Improving...
                </>
            ) : (
                <>
                <Sparkles className="h-4 w-4 mr-2" />
                Improve with AI
                </>
            )}
        </Button>

            {errors.skills && (
                <p className="text-sm text-red-500">
                    {errors.skills.message}
                </p>
            )}
    </div>

    <div className="space-y-4">
        <h3 className="text-lg font-medium">Work Experience</h3>
        <Controller
            name="experience"
            control={control}
            render={({field}) => (
                <EntryForm
                type="Experience"
                entries={field.value}
                onChange={field.onChange}
            />
            )}
            />

            {errors.experience && (
                <p className="text-sm text-red-500">
                    {errors.experience.message}
                </p>
            )}
    </div>

    <div className="space-y-4">
        <h3 className="text-lg font-medium">Education</h3>
        <Controller
            name="education"
            control={control}
            render={({field}) => (
               <EntryForm
                type="Education"
                entries={field.value}
                onChange={field.onChange}
            /> 
            )}
            
            />

            {errors.education && (
                <p className="text-sm text-red-500">
                    {errors.education.message}
                </p>
            )}
    </div>

    <div className="space-y-4">
        <h3 className="text-lg font-medium">Projects</h3>
        <Controller
            name="projects"
            control={control}
            render={({field}) => (
                <EntryForm
                type="Project"
                entries={field.value}
                onChange={field.onChange}
            />
            )}
            
            />

            {errors.projects && (
                <p className="text-sm text-red-500">
                    {errors.projects.message}
                </p>
            )}
    </div>

    </form>
  </TabsContent>
  <TabsContent value="preview">
    <Button variant="link" type="button" className="mb-2" 
    onClick={() =>
        setResumeMode(resumeMode === "preview" ? "edit" : "preview")
    }
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
        <div className="flex p-3 gap-2 items-center border-2 border-yellow-600
        text-yellow-600 rounded mb-2">
            <AlertTriangle className='h-5 w-5' />
                <span>
                You will lose the edited markdown if you update the form data.
                </span>
        </div>
    )}

    <div className='border rounded-lg'>
        <MDEditor
        value={previewContent}
        onChange={setPreviewContent}
        height={800}
        preview={resumeMode}
        />

    </div>



  </TabsContent>
</Tabs>
    {/* <div className="hidden">
    <div id='resume-pdf'>
        
        <MDEditor.Markdown
        source={previewContent}
        style={{
            background:"#ffffff",
            color:"#000000",
        }}
        />

    </div>
    </div> */}

    <div style={{ position: "absolute", left: "-9999px", top: "0", width: "210mm" }}>
  <div 
    id="resume-pdf" 
    className="bg-white p-10 print-container" 
    style={{ 
      backgroundColor: "#ffffff", // Use Hex instead of Tailwind classes
      color: "#000000" 
    }}
  >
    <MDEditor.Markdown 
      source={previewContent} 
      style={{ 
        backgroundColor: "#ffffff", 
        color: "#000000" 
      }} 
    />
  </div>
</div>
    </div>
  )
}


export default ResumeBuilder