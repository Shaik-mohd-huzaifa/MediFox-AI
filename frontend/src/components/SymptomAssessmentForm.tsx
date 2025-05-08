import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import aiService, { SymptomAssessmentResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form schema
const formSchema = z.object({
  symptoms: z.string().min(10, {
    message: 'Symptoms must be at least 10 characters long',
  }),
  age: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  sex: z.string().optional(),
  medicalHistory: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SymptomAssessmentForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState<SymptomAssessmentResponse | null>(null);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: '',
      age: '',
      sex: '',
      medicalHistory: '',
    },
  });

  // Submit handler
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await aiService.assessSymptoms({
        symptoms: values.symptoms,
        age: values.age,
        sex: values.sex,
        medical_history: values.medicalHistory,
      });
      
      setAssessment(response);
      toast.success('Symptoms assessed successfully');
    } catch (error) {
      console.error('Failed to assess symptoms:', error);
      toast.error('Failed to assess symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Symptom Assessment</CardTitle>
          <CardDescription>
            Describe your symptoms and get an AI-powered assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symptoms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your symptoms in detail..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be as detailed as possible about what you're experiencing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Age"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biological Sex</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any relevant medical history, conditions or medications..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assessing...
                  </>
                ) : (
                  'Assess Symptoms'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {assessment && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Assessment Results</CardTitle>
            <CardDescription>
              Based on the information provided
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={`${
              assessment.urgency_level === 'high' ? 'bg-red-50 border-red-500' :
              assessment.urgency_level === 'medium' ? 'bg-amber-50 border-amber-500' :
              'bg-green-50 border-green-500'
            }`}>
              <AlertTitle className="font-semibold">
                {assessment.urgency_level === 'high' ? 'Urgent Attention Required' : 
                 assessment.urgency_level === 'medium' ? 'Medical Attention Advised' : 
                 'Low Urgency'}
              </AlertTitle>
              <AlertDescription>
                {assessment.urgency_description}
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="text-lg font-semibold mb-2">Analysis</h3>
              <p className="text-gray-700">{assessment.reasoning}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
              <ul className="list-disc pl-5 space-y-1">
                {Array.isArray(assessment.recommendations) ? 
                  assessment.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-gray-700">{rec}</li>
                  )) :
                  <li className="text-gray-700">{assessment.recommendations}</li>
                }
              </ul>
            </div>

            {assessment.pubmed_references && assessment.pubmed_references.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Medical References</h3>
                <ul className="space-y-2">
                  {assessment.pubmed_references.map((ref, idx) => (
                    <li key={idx} className="text-sm border-l-2 border-gray-200 pl-3">
                      <p className="font-medium">{ref.title}</p>
                      <p className="text-gray-500 text-xs">PMID: {ref.pmid} | {ref.date}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-500 italic mt-4">
              {assessment.disclaimer}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setAssessment(null)}>New Assessment</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
