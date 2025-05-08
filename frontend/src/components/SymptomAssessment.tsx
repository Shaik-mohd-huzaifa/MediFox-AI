import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import aiService, { SymptomAssessmentResponse } from "@/services/api";

// Interface is imported from API service

export function SymptomAssessment() {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState<string>("");
  const [sex, setSex] = useState<string>("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomAssessmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.assessSymptoms({
        symptoms: symptoms,
        age: age ? parseInt(age) : undefined,
        sex: sex || undefined,
        medical_history: medicalHistory || undefined
      });
      
      setResult(response);
      toast.success("Symptoms assessed successfully");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to assess symptoms";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50 border-red-500";
      case "medium":
        return "text-yellow-600 bg-amber-50 border-amber-500";
      case "low":
        return "text-green-600 bg-green-50 border-green-500";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Symptom Assessment</CardTitle>
          <CardDescription>
            Describe your symptoms and get an AI-powered assessment from our medical model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Symptoms</label>
              <Textarea
                placeholder="Describe your symptoms in detail..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Biological Sex</label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Medical History (Optional)</label>
              <Textarea
                placeholder="Any relevant medical history, conditions or medications..."
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
              />
            </div>
            
            <Button type="submit" disabled={loading || !symptoms.trim()} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Assessing...' : 'Assess Symptoms'}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <Alert className={getUrgencyColor(result.urgency_level)}>
                <AlertTitle>
                  {result.urgency_level === 'high' ? 'Urgent Attention Required' : 
                   result.urgency_level === 'medium' ? 'Medical Attention Advised' : 
                   'Low Urgency'}
                </AlertTitle>
                <AlertDescription>
                  {result.urgency_description}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{result.reasoning}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {Array.isArray(result.recommendations) ? 
                      JSON.parse(result.recommendations).map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">{rec}</li>
                      )) :
                      <li className="text-sm text-gray-700">{result.recommendations}</li>
                    }
                  </ul>
                </CardContent>
              </Card>
              
              {result.pubmed_references && result.pubmed_references.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Medical References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.pubmed_references.map((ref, idx) => (
                        <li key={idx} className="text-sm border-l-2 border-gray-200 pl-3">
                          <p className="font-medium">{ref.title}</p>
                          <p className="text-gray-500 text-xs">PMID: {ref.pmid} | {ref.date}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              <p className="text-xs text-gray-500 italic mt-2">
                {result.disclaimer}
              </p>
            </div>
          )}
        </CardContent>
        {result && (
          <CardFooter>
            <Button variant="outline" onClick={() => setResult(null)}>New Assessment</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}