"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import QuizResult from './quiz-result';

const QuizList = ({assessments}) => {
    const router = useRouter();
    const [selectedQuiz, setSelectedQuiz] = useState(null);
  return (
    <>
    <Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <div>

    <CardTitle className="gradient-title text-3xl md:text-4xl">
        Recent Quizzes
    </CardTitle>
    <CardDescription className="flex justify-between w-full">Review your past quiz performance</CardDescription>
    </div>

    <Button onClick={() => router.push("/interview/mock")}>
        Start New Quiz
    </Button>
    
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
        {assessments.map((assessment, i)=>{
            return (
            <Card 
            key={assessment.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedQuiz(assessment)}
            >
            
            <CardHeader>
                <CardTitle>Quiz {i + 1}</CardTitle>
                <CardDescription>
                    <div>Score: {assessment.quizScore.toFixed(1)}%</div>
                    <div>
                       {format(
                        new Date(assessment.createdAt),
                        "MMMM dd, yyyy HH:mm"
                       )} 
                    </div>
                </CardDescription>
                
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {assessment.improvementTip}
                    </p>
            </CardContent>
           
            </Card>
            )
        })}
    </div>
  </CardContent>
</Card>

<Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
  
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle></DialogTitle>
      <QuizResult
        result={selectedQuiz}
        onStartNew={() => router.push("interview/mock")}
        hideStartNew
        />
      
    </DialogHeader>
  </DialogContent>
</Dialog>
    </>
  )
}

export default QuizList