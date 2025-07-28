import React, { useState, useEffect } from 'react';
import { School, Mail, Phone, User, Calendar, MapPin, Eye, Trash2, Filter, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { db } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { useAdminPermissions } from './AdminContext';

interface SchoolRequest {
  id: string;
  schoolName: string;
  city: string;
  contactPerson: string;
  phone: string;
  email: string;
  message?: string;
  timestamp: any;
  status: 'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'rejected';
}

const SchoolRequestsTab = () => {
  const { canDelete } = useAdminPermissions();
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, 'schoolRequests'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SchoolRequest[];
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching school requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'schoolRequests', requestId), {
        status: newStatus
      });
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!canDelete) {
      alert('Permission Denied: You don\'t have permission to delete school requests. Only the main administrator can perform delete operations.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this school request?')) {
      try {
        await deleteDoc(doc(db, 'schoolRequests', requestId));
        setRequests(requests.filter(r => r.id !== requestId));
        setSelectedRequest(null);
      } catch (error) {
        console.error('Error deleting request:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'demo_scheduled': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'demo_scheduled': return 'Demo Scheduled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredRequests = requests.filter(request => {
    return statusFilter === 'all' || request.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-vibrant-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-deep-blue">School Partnership Requests</h2>
          <p className="text-gray-600">Manage school inquiries and partnership requests</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {requests.length} Total Requests
        </Badge>
      </div>

      {/* Status Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card 
              key={request.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedRequest?.id === request.id ? 'ring-2 ring-vibrant-orange' : ''
              }`}
              onClick={() => setSelectedRequest(request)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-deep-blue">{request.schoolName}</span>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{request.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{request.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span>{request.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span>{request.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(request.timestamp)}</span>
                  </div>
                </div>
                
                {request.message && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {request.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          
          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No school requests found.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Request Details */}
        <div>
          {selectedRequest ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Request Details</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRequest(selectedRequest.id)}
                    className={canDelete 
                      ? "text-red-600 hover:text-red-700" 
                      : "text-gray-400 cursor-not-allowed opacity-50"
                    }
                    disabled={!canDelete}
                    title={canDelete ? "Delete request" : "Permission Denied - Only main admin can delete"}
                  >
                    {canDelete ? <Trash2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">School Name</label>
                  <p className="text-deep-blue font-semibold">{selectedRequest.schoolName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <p className="text-deep-blue">{selectedRequest.city}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="text-deep-blue">{selectedRequest.contactPerson}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-deep-blue">{selectedRequest.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-deep-blue">{selectedRequest.phone}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <p className="text-deep-blue">{formatDate(selectedRequest.timestamp)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select 
                    value={selectedRequest.status} 
                    onValueChange={(value: 'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'rejected') => 
                      updateRequestStatus(selectedRequest.id, value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedRequest.message && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <div className="bg-gray-50 p-3 rounded-lg mt-1">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a request to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolRequestsTab; 