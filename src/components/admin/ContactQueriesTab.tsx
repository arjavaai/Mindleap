import React, { useState, useEffect } from 'react';
import { Mail, Phone, User, Calendar, MessageSquare, Tag, Eye, Trash2, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { db } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';

interface ContactQuery {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  source: string;
  timestamp: any;
  status: 'new' | 'contacted' | 'resolved';
}

const ContactQueriesTab = () => {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const q = query(collection(db, 'contactQueries'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const queriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContactQuery[];
      setQueries(queriesData);
    } catch (error) {
      console.error('Error fetching contact queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQueryStatus = async (queryId: string, newStatus: 'new' | 'contacted' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'contactQueries', queryId), {
        status: newStatus
      });
      setQueries(queries.map(q => 
        q.id === queryId ? { ...q, status: newStatus } : q
      ));
    } catch (error) {
      console.error('Error updating query status:', error);
    }
  };

  const deleteQuery = async (queryId: string) => {
    if (window.confirm('Are you sure you want to delete this query?')) {
      try {
        await deleteDoc(doc(db, 'contactQueries', queryId));
        setQueries(queries.filter(q => q.id !== queryId));
        setSelectedQuery(null);
      } catch (error) {
        console.error('Error deleting query:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredQueries = queries.filter(query => {
    return statusFilter === 'all' || query.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-vibrant-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-deep-blue">Contact Queries</h2>
          <p className="text-gray-600">Manage customer inquiries and contact form submissions</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {queries.length} Total Queries
        </Badge>
      </div>

      {/* Status Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Queries List */}
        <div className="space-y-4">
          {filteredQueries.map((query) => (
            <Card 
              key={query.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedQuery?.id === query.id ? 'ring-2 ring-vibrant-orange' : ''
              }`}
              onClick={() => setSelectedQuery(query)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-deep-blue">{query.name}</span>
                  </div>
                  <Badge className={getStatusColor(query.status)}>
                    {query.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span>{query.email}</span>
                  </div>
                  {query.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{query.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(query.timestamp)}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {query.source}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                  {query.message}
                </p>
              </CardContent>
            </Card>
          ))}
          
          {filteredQueries.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No queries found.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Query Details */}
        <div>
          {selectedQuery ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Query Details</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteQuery(selectedQuery.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-deep-blue font-semibold">{selectedQuery.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-deep-blue">{selectedQuery.email}</p>
                </div>
                
                {selectedQuery.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-deep-blue">{selectedQuery.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Source</label>
                  <Badge variant="outline">{selectedQuery.source}</Badge>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <p className="text-deep-blue">{formatDate(selectedQuery.timestamp)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select 
                    value={selectedQuery.status} 
                    onValueChange={(value: 'new' | 'contacted' | 'resolved') => 
                      updateQueryStatus(selectedQuery.id, value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <div className="bg-gray-50 p-3 rounded-lg mt-1">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedQuery.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a query to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactQueriesTab; 