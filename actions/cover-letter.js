"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: process.env.MODEL,
});

export async function saveCoverLetter(content) {
    const {userId} = await auth();
        if (!userId) throw new Error("Unauthorized");
    
        const user = await db.user.findUnique({
            where:{
                clerkUserId: userId,
            },
        });
    
        if (!user) throw new Error("User not found");

        try {
            const resume = await db.resume.upsert({
                where: {
                    userId: user.id,
                },
                update: {
                    content,
                },
                create: {
                    userId: user.id,
                    content,
                },
            });

            revalidatePath("/resume");
            return resume;
            
        } catch (error) {
            console.error("Error saving resume:", error.message);
            throw new Error("Failed to save resume");
        }

    }

    export async function getCoverLetter() {
        const {userId} = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: {clerkUserId: userId},
        });

        if (!user) throw new Error("User not found");
        
        return await db.resume.findUnique({
            where: {
                userId: user.id,
            },
        });

    }

    export async function improveWithAI({current, type, organization}) {
        const {userId} = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: {clerkUserId: userId},
            include: {
                industryInsight: true,
            },
        });

        if (!user) throw new Error("User not found");

    const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${
    data.companyName
  }.
    
    About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user.bio}
    
    Job Description:
    ${data.jobDescription}
    
    Requirements:
    1. Use a professional, enthusiastic tone
    2. Highlight relevant skills and experience
    3. Show understanding of the company's needs
    4. Keep it concise (max 400 words)
    5. Use proper business letter formatting in markdown
    6. Include specific examples of achievements
    7. Relate candidate's background to job requirements
    
    Format the letter in markdown.
  `;


  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();

    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
    }