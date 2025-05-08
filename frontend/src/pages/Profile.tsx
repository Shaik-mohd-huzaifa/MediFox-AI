import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Save, User, Heart, Calendar, Mail, Phone, AlertCircle, Settings, FileText, Upload, X, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interface for uploaded document
interface MedicalDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  dateUploaded: Date;
  file: File;
  content?: string; // Optional document content if extracted
}

// Interface for form data
interface ProfileFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Medical Information
  height: string;
  weight: string;
  bloodType: string;
  allergies: string;
  medications: string;
  medicalConditions: string;
  familyMedicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  primaryPhysician: string;
  
  // Medical Documents
  medicalDocuments: MedicalDocument[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{value: number}>;
  label?: string;
}

const Profile = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  
  // Initialize form data state
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    height: '',
    weight: '',
    bloodType: '',
    allergies: '',
    medications: '',
    medicalConditions: '',
    familyMedicalHistory: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    primaryPhysician: '',
    medicalDocuments: []
  });
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newDocuments: MedicalDocument[] = [];
    
    Array.from(files).forEach(file => {
      // Create a new document object
      const newDoc: MedicalDocument = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        dateUploaded: new Date(),
        file: file
      };
      
      newDocuments.push(newDoc);
    });
    
    // Update form data with new documents
    setFormData(prev => ({
      ...prev,
      medicalDocuments: [...prev.medicalDocuments, ...newDocuments]
    }));
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Show success toast
    toast({
      title: 'Documents Uploaded',
      description: `Successfully uploaded ${newDocuments.length} document(s)`,
      variant: 'success'
    });
  };
  
  // Handle file removal
  const handleRemoveDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medicalDocuments: prev.medicalDocuments.filter(doc => doc.id !== id)
    }));
    
    toast({
      title: 'Document Removed',
      description: 'Document has been removed from your profile',
      variant: 'default'
    });
  };
  
  // Format file size
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return sizeInBytes + ' bytes';
    } else if (sizeInBytes < 1024 * 1024) {
      return (sizeInBytes / 1024).toFixed(1) + ' KB';
    } else {
      return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to the server
    console.log('Form submitted:', {
      ...formData,
      // Only send document metadata, not the actual file objects in the log
      medicalDocuments: formData.medicalDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        dateUploaded: doc.dateUploaded
      }))
    });
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
      variant: 'success'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Profile</h1>
          <p className="text-gray-600">Manage your personal and medical information</p>
        </div>
        
        <Tabs defaultValue="personal">
          <TabsList className="mb-4">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="medical">Medical Information</TabsTrigger>
            <TabsTrigger value="documents">Medical Documents</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                      />
                    </div>
                    
                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex">
                        <div className="flex items-center bg-gray-100 px-3 rounded-l-md border border-r-0 border-gray-300">
                          <Mail size={16} className="text-gray-500" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          type="email"
                          className="rounded-l-none"
                          placeholder="johndoe@example.com"
                        />
                      </div>
                    </div>
                    
                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex">
                        <div className="flex items-center bg-gray-100 px-3 rounded-l-md border border-r-0 border-gray-300">
                          <Phone size={16} className="text-gray-500" />
                        </div>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(123) 456-7890"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <div className="flex">
                        <div className="flex items-center bg-gray-100 px-3 rounded-l-md border border-r-0 border-gray-300">
                          <Calendar size={16} className="text-gray-500" />
                        </div>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          type="date"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                    
                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleSelectChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main St"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* City */}
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="New York"
                      />
                    </div>
                    
                    {/* State */}
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="NY"
                      />
                    </div>
                    
                    {/* Zip Code */}
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Information</CardTitle>
                  <CardDescription>Update your medical details for better health assessments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Height */}
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="175"
                      />
                    </div>
                    
                    {/* Weight */}
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="70"
                      />
                    </div>
                    
                    {/* Blood Type */}
                    <div className="space-y-2">
                      <Label htmlFor="bloodType">Blood Type</Label>
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) => handleSelectChange('bloodType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Allergies */}
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="List any allergies (e.g., penicillin, peanuts, etc.)"
                    />
                  </div>
                  
                  {/* Current Medications */}
                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      name="medications"
                      value={formData.medications}
                      onChange={handleChange}
                      placeholder="List any medications you are currently taking"
                    />
                  </div>
                  
                  {/* Medical Conditions */}
                  <div className="space-y-2">
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Textarea
                      id="medicalConditions"
                      name="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={handleChange}
                      placeholder="List any existing medical conditions or past surgeries"
                    />
                  </div>
                  
                  {/* Family Medical History */}
                  <div className="space-y-2">
                    <Label htmlFor="familyMedicalHistory">Family Medical History</Label>
                    <Textarea
                      id="familyMedicalHistory"
                      name="familyMedicalHistory"
                      value={formData.familyMedicalHistory}
                      onChange={handleChange}
                      placeholder="Any relevant family medical history"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Emergency Contact Name */}
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                      />
                    </div>
                    
                    {/* Emergency Contact Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyContactPhone"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleChange}
                        placeholder="(123) 456-7890"
                      />
                    </div>
                  </div>
                  
                  {/* Primary Physician */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryPhysician">Primary Physician</Label>
                    <Input
                      id="primaryPhysician"
                      name="primaryPhysician"
                      value={formData.primaryPhysician}
                      onChange={handleChange}
                      placeholder="Dr. Smith"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Documents</CardTitle>
                  <CardDescription>
                    Upload your medical documents for better assessments. These documents will provide additional context to our AI when analyzing your symptoms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Privacy Notice</AlertTitle>
                    <AlertDescription>
                      Documents you upload are securely stored and only used to enhance your symptom assessments. They will never be shared with third parties.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium mb-1">Upload Medical Documents</h3>
                      <p className="text-sm text-gray-500 mb-4">Drag and drop your files here or click to browse</p>
                      <Button variant="outline" type="button" onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}>
                        Select Files
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                      />
                      <p className="text-xs text-gray-400 mt-2">Supported formats: PDF, JPG, PNG, DOC, DOCX, TXT</p>
                    </div>
                    
                    {formData.medicalDocuments.length > 0 ? (
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                          <h3 className="font-medium">Uploaded Documents ({formData.medicalDocuments.length})</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {formData.medicalDocuments.map((doc) => (
                            <li key={doc.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                              <div className="flex items-center">
                                <File className="h-10 w-10 text-blue-500 mr-3" />
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(doc.size)} • Uploaded on {doc.dateUploaded.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveDocument(doc.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <p>No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <div className="mt-6 flex justify-end">
              <Button 
                type="submit"
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save Profile
              </Button>
            </div>
          </form>
        </Tabs>
      </main>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border shadow-md rounded-md">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-gray-700">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }

  return null;
};

export default Profile;
