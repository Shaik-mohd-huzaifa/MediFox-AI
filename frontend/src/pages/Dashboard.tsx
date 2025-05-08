
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, CalendarIcon, Clock, AlertCircle, CheckCircle, User, X } from 'lucide-react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types for our data
interface Appointment {
  id: number;
  patient_id: number;
  assessment_id?: number;
  title: string;
  description?: string;
  urgency_level: string;
  status: string;
  appointment_time?: string;
  created_at: string;
  updated_at: string;
  patient: Patient;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  age?: number;
  blood_type?: string;
  height?: number;
  weight?: number;
  allergies?: string;
  chronic_conditions?: string;
  primary_physician?: string;
  emergency_contact?: string;
  insurance_provider?: string;
  medical_history?: string;
}

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/appointments`);
        setAppointments(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Function to handle appointment selection
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowPatientDetails(true);
  };

  // Function to close the patient details sidebar
  const closePatientDetails = () => {
    setShowPatientDetails(false);
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get urgency badge color
  const getUrgencyBadge = (level: string) => {
    switch(level.toLowerCase()) {
      case 'high':
      case 'emergency':
        return <Badge className="bg-red-500">Emergency</Badge>;
      case 'medium':
        return <Badge className="bg-orange-400">Urgent</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Standard</Badge>;
      default:
        return <Badge>{level}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-500 border-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <main className={`flex-1 overflow-hidden ${showPatientDetails ? 'grid grid-cols-[1fr_400px]' : 'block'}`}>
        <div className="p-6 overflow-auto h-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">Doctor Dashboard</h1>
            <p className="text-gray-600">View and manage patient appointments</p>
          </div>
          
          {/* Appointments Analytics Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Patient Appointments</h2>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ff7f2e]" size={16} />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none w-[220px]"
                  />
                </div>
                
                <Button variant="outline" className="text-sm flex items-center gap-2">
                  <CalendarIcon size={14} className="text-[#ff7f2e]" />
                  Filter by Date
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff7f2e]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="mx-auto mb-2" size={24} />
                <p>{error}</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No appointments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Tabs defaultValue="all" className="mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All Appointments</TabsTrigger>
                    <TabsTrigger value="emergency" className="text-red-500">Emergency</TabsTrigger>
                    <TabsTrigger value="urgent">Urgent</TabsTrigger>
                    <TabsTrigger value="standard">Standard</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Appointment Details</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow 
                        key={appointment.id} 
                        className={`cursor-pointer hover:bg-gray-50 ${
                          appointment.urgency_level.toLowerCase() === 'high' || 
                          appointment.urgency_level.toLowerCase() === 'emergency' 
                            ? 'bg-red-50' 
                            : ''
                        }`}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <TableCell className="font-medium">APP-{appointment.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="font-medium">
                                {appointment.patient.first_name} {appointment.patient.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {appointment.patient.age ? `${appointment.patient.age} years` : ''}
                                {appointment.patient.gender ? `, ${appointment.patient.gender}` : ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium truncate max-w-[250px]">{appointment.title}</p>
                          {appointment.appointment_time ? (
                            <p className="text-xs text-gray-500 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {formatDate(appointment.appointment_time)}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>{getUrgencyBadge(appointment.urgency_level)}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell>
                          <p className="text-sm">{formatDate(appointment.created_at)}</p>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Patient Details Sidebar */}
        {showPatientDetails && selectedAppointment && (
          <div className="border-l border-gray-200 h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
              <h3 className="font-bold text-lg">Patient Details</h3>
              <Button variant="ghost" size="icon" onClick={closePatientDetails}>
                <X size={18} />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-65px)]">
              <div className="p-4">
                {/* Patient Profile Card */}
                <Card className="p-4 mb-4">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {selectedAppointment.patient.first_name} {selectedAppointment.patient.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedAppointment.patient.age ? `${selectedAppointment.patient.age} years` : ''}
                        {selectedAppointment.patient.gender ? `, ${selectedAppointment.patient.gender}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    {selectedAppointment.patient.email && (
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p>{selectedAppointment.patient.email}</p>
                      </div>
                    )}
                    {selectedAppointment.patient.phone && (
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p>{selectedAppointment.patient.phone}</p>
                      </div>
                    )}
                    {selectedAppointment.patient.blood_type && (
                      <div>
                        <p className="text-gray-500">Blood Type</p>
                        <p>{selectedAppointment.patient.blood_type}</p>
                      </div>
                    )}
                    {selectedAppointment.patient.primary_physician && (
                      <div>
                        <p className="text-gray-500">Primary Physician</p>
                        <p>{selectedAppointment.patient.primary_physician}</p>
                      </div>
                    )}
                  </div>
                </Card>
                
                {/* Current Appointment Card */}
                <Card className="p-4 mb-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <span className="text-[#ff7f2e] mr-2">
                      {selectedAppointment.urgency_level.toLowerCase() === 'high' || 
                       selectedAppointment.urgency_level.toLowerCase() === 'emergency' ? 
                        <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    </span>
                    Current Situation
                  </h3>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{selectedAppointment.title}</p>
                      {getUrgencyBadge(selectedAppointment.urgency_level)}
                    </div>
                    
                    <p className="text-sm text-gray-700 whitespace-pre-line mb-2">
                      {selectedAppointment.description}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      Created: {formatDate(selectedAppointment.created_at)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button className="w-full">
                      Start Consultation
                    </Button>
                    <Button variant="outline" className="w-full">
                      Update Status
                    </Button>
                  </div>
                </Card>
                
                {/* Medical History Card */}
                {(selectedAppointment.patient.medical_history || 
                  selectedAppointment.patient.chronic_conditions || 
                  selectedAppointment.patient.allergies) && (
                  <Card className="p-4 mb-4">
                    <h3 className="font-semibold mb-3">Medical History</h3>
                    
                    {selectedAppointment.patient.medical_history && (
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm mb-1">Previous Conditions</p>
                        <p className="text-sm whitespace-pre-line">{selectedAppointment.patient.medical_history}</p>
                      </div>
                    )}
                    
                    {selectedAppointment.patient.chronic_conditions && (
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm mb-1">Chronic Conditions</p>
                        <p className="text-sm">{selectedAppointment.patient.chronic_conditions}</p>
                      </div>
                    )}
                    
                    {selectedAppointment.patient.allergies && (
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm mb-1">Allergies</p>
                        <p className="text-sm">{selectedAppointment.patient.allergies}</p>
                      </div>
                    )}
                  </Card>
                )}
                
                {/* Additional Patient Information */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Additional Information</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedAppointment.patient.height && (
                      <div>
                        <p className="text-gray-500">Height</p>
                        <p>{selectedAppointment.patient.height} cm</p>
                      </div>
                    )}
                    {selectedAppointment.patient.weight && (
                      <div>
                        <p className="text-gray-500">Weight</p>
                        <p>{selectedAppointment.patient.weight} kg</p>
                      </div>
                    )}
                    {selectedAppointment.patient.insurance_provider && (
                      <div>
                        <p className="text-gray-500">Insurance</p>
                        <p>{selectedAppointment.patient.insurance_provider}</p>
                      </div>
                    )}
                    {selectedAppointment.patient.emergency_contact && (
                      <div>
                        <p className="text-gray-500">Emergency Contact</p>
                        <p>{selectedAppointment.patient.emergency_contact}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
