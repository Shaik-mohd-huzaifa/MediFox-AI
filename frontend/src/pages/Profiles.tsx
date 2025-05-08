import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { PlusCircle, Search, User, Clock, Filter, X, Heart, Calendar, Mail, Phone, MapPin, Clipboard, Activity, Pill, Shield, FileText, Thermometer, Smile } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Interface for profile data
interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  age: number;
  gender: string;
  date_of_birth: string;
  email: string;
  phone: string;
  blood_type: string;
  chronic_conditions: string[];
  allergies: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  immunizations: Array<{
    vaccine: string;
    date: string;
  }>;
  height: number;
  weight: number;
  bmi: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  medical_history: string;
  family_medical_history: string;
  smoking_status: string;
  alcohol_consumption: string;
  exercise_frequency: string;
  diet_restrictions: string;
  occupation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  primary_physician: string;
  primary_physician_phone: string;
  insurance_provider: string;
  insurance_policy_number: string;
  surgical_history: Array<{
    procedure: string;
    date: string;
    hospital: string;
    surgeon: string;
    notes: string;
  }>;
}

const Profiles = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch profiles data from API
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch('/api/profiles');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProfiles(data);
        setFilteredProfiles(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: 'Failed to load profiles',
          description: 'There was an error loading the patient profiles.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [toast]);
  
  // Apply filters and search to the profiles
  useEffect(() => {
    let result = [...profiles];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(profile => 
        profile.full_name.toLowerCase().includes(query) || 
        profile.email?.toLowerCase().includes(query) ||
        profile.phone?.toLowerCase().includes(query)
      );
    }
    
    // Apply gender filter
    if (genderFilter !== 'all') {
      result = result.filter(profile => profile.gender === genderFilter);
    }
    
    // Apply age filter
    if (ageFilter !== 'all') {
      switch(ageFilter) {
        case 'under30':
          result = result.filter(profile => profile.age < 30);
          break;
        case '30to50':
          result = result.filter(profile => profile.age >= 30 && profile.age <= 50);
          break;
        case 'over50':
          result = result.filter(profile => profile.age > 50);
          break;
        default:
          break;
      }
    }
    
    setFilteredProfiles(result);
  }, [searchQuery, genderFilter, ageFilter, profiles]);
  
  // Handle profile selection and sidebar display
  const handleProfileClick = (profile: ProfileData) => {
    setSelectedProfile(profile);
    setSidebarOpen(true);
  };
  
  // Close detail sidebar
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Render loading skeletons
  const renderSkeletons = () => (
    <>
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="cursor-pointer hover:border-blue-300 transition-colors">
          <CardContent className="p-0">
            <div className="flex items-start p-4 space-x-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex space-x-2 pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
  
  // Render medical conditions badges
  const renderConditionBadges = (conditions: string[]) => {
    if (!conditions || conditions.length === 0) return <Badge variant="outline">No conditions</Badge>;
    
    return conditions.slice(0, 2).map((condition, i) => (
      <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
        {condition}
      </Badge>
    ));
  };
  
  // Render surgery information
  const renderSurgeryInfo = (surgeries: Array<{procedure: string, date: string}>) => {
    if (!surgeries || surgeries.length === 0) return null;
    
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        {surgeries.length} {surgeries.length === 1 ? 'Surgery' : 'Surgeries'}
      </Badge>
    );
  };

  // Format date string to more readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <main className={`flex-1 overflow-auto p-6 transition-all duration-300 ${sidebarOpen ? 'mr-[30%]' : ''}`}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Profiles</h1>
          <p className="text-gray-500">View and manage all patient profiles</p>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="w-36">
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-10">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Gender" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-36">
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger className="h-10">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Age" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="under30">Under 30</SelectItem>
                    <SelectItem value="30to50">30 to 50</SelectItem>
                    <SelectItem value="over50">Over 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="default">
                <PlusCircle className="h-4 w-4 mr-2" /> New Patient
              </Button>
            </div>
          </div>
        </div>
        
        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            renderSkeletons()
          ) : filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile) => (
              <Card 
                key={profile.id} 
                className="cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => handleProfileClick(profile)}
              >
                <CardContent className="p-0">
                  <div className="flex items-start p-4 space-x-4">
                    <div className="flex-shrink-0 h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-7 w-7 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{profile.full_name}</h3>
                      <p className="text-sm text-gray-500 mb-1">
                        {profile.age} yrs • {profile.gender} • {profile.blood_type || 'Unknown blood type'}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {renderConditionBadges(profile.chronic_conditions)}
                        {profile.surgical_history && profile.surgical_history.length > 0 && 
                          renderSurgeryInfo(profile.surgical_history)
                        }
                        {profile.allergies && profile.allergies.length > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {profile.allergies.length} {profile.allergies.length === 1 ? 'Allergy' : 'Allergies'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setGenderFilter('all');
                  setAgeFilter('all');
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>
      
      {/* Patient Detail Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out shadow-lg z-10 ${sidebarOpen ? 'w-[30%]' : 'w-0 opacity-0'}`}
      >
        {selectedProfile && sidebarOpen && (
          <div className="p-6 h-full">
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Patient Details</h2>
              <button 
                onClick={handleCloseSidebar}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Patient Identity Section */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center mb-4">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProfile.full_name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedProfile.age} years • {selectedProfile.gender} • {selectedProfile.blood_type || 'Unknown blood type'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">{formatDate(selectedProfile.date_of_birth)}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">{selectedProfile.email || 'No email'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">{selectedProfile.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">
                    {selectedProfile.city && selectedProfile.state ? 
                      `${selectedProfile.city}, ${selectedProfile.state}` : 'No location'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Medical Information */}
            <div className="space-y-6">
              {/* Physical Metrics */}
              <div className="pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Physical Stats</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <div className="flex justify-center mb-1">
                      <Thermometer className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-xl font-semibold">{selectedProfile.height ? `${selectedProfile.height}cm` : '-'}</div>
                    <div className="text-xs text-gray-500">Height</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <div className="flex justify-center mb-1">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-xl font-semibold">{selectedProfile.weight ? `${selectedProfile.weight}kg` : '-'}</div>
                    <div className="text-xs text-gray-500">Weight</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <div className="flex justify-center mb-1">
                      <Heart className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-xl font-semibold">{selectedProfile.bmi ? selectedProfile.bmi.toFixed(1) : '-'}</div>
                    <div className="text-xs text-gray-500">BMI</div>
                  </div>
                </div>
              </div>
              
              {/* Medical Conditions */}
              <div className="pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  <div className="flex items-center">
                    <Clipboard className="h-4 w-4 mr-2" />
                    Medical Conditions
                  </div>
                </h4>
                {selectedProfile.chronic_conditions && selectedProfile.chronic_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.chronic_conditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No chronic conditions recorded</p>
                )}
              </div>
              
              {/* Allergies */}
              <div className="pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Allergies
                  </div>
                </h4>
                {selectedProfile.allergies && selectedProfile.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No allergies recorded</p>
                )}
              </div>
              
              {/* Medications */}
              <div className="pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  <div className="flex items-center">
                    <Pill className="h-4 w-4 mr-2" />
                    Current Medications
                  </div>
                </h4>
                {selectedProfile.medications && selectedProfile.medications.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProfile.medications.map((medication, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium">{medication.name}</div>
                        <div className="text-sm text-gray-500">{medication.dosage} • {medication.frequency}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No current medications</p>
                )}
              </div>
              
              {/* Surgical History */}
              <div className="pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Surgical History
                  </div>
                </h4>
                {selectedProfile.surgical_history && selectedProfile.surgical_history.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProfile.surgical_history.map((surgery, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium">{surgery.procedure}</div>
                        <div className="text-sm text-gray-500 mb-1">{formatDate(surgery.date)} • {surgery.hospital}</div>
                        <div className="text-sm">Surgeon: {surgery.surgeon}</div>
                        {surgery.notes && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Notes:</span> {surgery.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No surgical history</p>
                )}
              </div>
              
              {/* Lifestyle Section */}
              <div className="pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  <div className="flex items-center">
                    <Smile className="h-4 w-4 mr-2" />
                    Lifestyle
                  </div>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Smoking:</span> {selectedProfile.smoking_status || 'Not recorded'}
                  </div>
                  <div>
                    <span className="text-gray-500">Alcohol:</span> {selectedProfile.alcohol_consumption || 'Not recorded'}
                  </div>
                  <div>
                    <span className="text-gray-500">Exercise:</span> {selectedProfile.exercise_frequency || 'Not recorded'}
                  </div>
                  <div>
                    <span className="text-gray-500">Diet:</span> {selectedProfile.diet_restrictions || 'No restrictions'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Occupation:</span> {selectedProfile.occupation || 'Not recorded'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profiles;
