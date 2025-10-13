# Contact Queries Management

## Overview
The Contact Queries Management section provides a comprehensive interface for administrators to view and manage contact form submissions. It allows filtering by status, viewing full details, updating query status, and deleting queries. This system helps administrators track and respond to user inquiries and feedback.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/ContactQueriesTab.tsx`
- **Access**: Available to administrators with 'queries' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Query Management**
- **View Queries**: Display all contact form submissions
- **Filter by Status**: Filter queries by status (pending, in-progress, resolved, closed)
- **Update Status**: Change query status
- **Delete Queries**: Remove queries (main admin only)

#### 2. **Status Management**
- **Status Tracking**: Track query resolution progress
- **Status Updates**: Update query status
- **Status Filtering**: Filter queries by current status
- **Visual Indicators**: Color-coded status indicators

#### 3. **Query Details**
- **Full Information**: Complete query details display
- **Contact Information**: Name, email, phone details
- **Message Content**: Full message content
- **Timestamp**: Query submission timestamp

#### 4. **Administrative Tools**
- **Bulk Operations**: Handle multiple queries
- **Search Functionality**: Search through queries
- **Export Options**: Export query data
- **Audit Trail**: Track query handling

### Database Connections

#### Firebase Collections Used:

1. **`contactQueries`** - Contact form submissions
   ```javascript
   {
     id: "queryId",
     name: "Contact Name",
     email: "contact@email.com",
     phone: "+1234567890",
     subject: "Query Subject",
     message: "Full message content",
     status: "pending", // "pending", "in-progress", "resolved", "closed"
     createdAt: timestamp,
     updatedAt: timestamp,
     resolvedAt: timestamp,
     resolvedBy: "adminId"
   }
   ```

### Component Architecture

#### Main Components:

1. **ContactQueriesTab Component**
   - Main container for query management
   - Manages state and data operations
   - Handles query filtering and status updates

2. **Query Management Components**:
   - `QueryCard`: Individual query display
   - `StatusFilter`: Status filtering component
   - `QueryDetailModal`: Detailed query view
   - `StatusUpdateModal`: Status update interface

#### State Management:
```javascript
const [queries, setQueries] = useState([]);
const [filteredQueries, setFilteredQueries] = useState([]);
const [selectedStatus, setSelectedStatus] = useState('all');
const [selectedQuery, setSelectedQuery] = useState(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [showStatusModal, setShowStatusModal] = useState(false);
const [loading, setLoading] = useState(false);
```

### Key Functions

#### 1. **fetchQueries()**
```javascript
const fetchQueries = async () => {
  setLoading(true);
  try {
    const queriesQuery = query(
      collection(db, 'contactQueries'),
      orderBy('createdAt', 'desc')
    );
    const queriesSnapshot = await getDocs(queriesQuery);
    
    const queriesData = queriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setQueries(queriesData);
    setFilteredQueries(queriesData);
  } catch (error) {
    console.error('Error fetching queries:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **updateQueryStatus()**
```javascript
const updateQueryStatus = async (queryId, newStatus) => {
  try {
    const queryRef = doc(db, 'contactQueries', queryId);
    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    };
    
    if (newStatus === 'resolved' || newStatus === 'closed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = auth.currentUser.uid;
    }
    
    await updateDoc(queryRef, updateData);
    
    // Update local state
    setQueries(prev => prev.map(query => 
      query.id === queryId 
        ? { ...query, ...updateData }
        : query
    ));
    
    setFilteredQueries(prev => prev.map(query => 
      query.id === queryId 
        ? { ...query, ...updateData }
        : query
    ));
    
    toast.success('Query status updated successfully');
  } catch (error) {
    console.error('Error updating query status:', error);
    toast.error('Error updating query status');
  }
};
```

#### 3. **deleteQuery()**
```javascript
const deleteQuery = async (queryId) => {
  try {
    await deleteDoc(doc(db, 'contactQueries', queryId));
    
    // Update local state
    setQueries(prev => prev.filter(query => query.id !== queryId));
    setFilteredQueries(prev => prev.filter(query => query.id !== queryId));
    
    toast.success('Query deleted successfully');
  } catch (error) {
    console.error('Error deleting query:', error);
    toast.error('Error deleting query');
  }
};
```

#### 4. **filterQueriesByStatus()**
```javascript
const filterQueriesByStatus = (status) => {
  setSelectedStatus(status);
  
  if (status === 'all') {
    setFilteredQueries(queries);
  } else {
    const filtered = queries.filter(query => query.status === status);
    setFilteredQueries(filtered);
  }
};
```

#### 5. **getStatusColor()**
```javascript
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'resolved': 'bg-green-100 text-green-800',
    'closed': 'bg-gray-100 text-gray-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};
```

#### 6. **formatDate()**
```javascript
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

#### 7. **handleViewQuery()**
```javascript
const handleViewQuery = (query) => {
  setSelectedQuery(query);
  setShowDetailModal(true);
};
```

#### 8. **handleUpdateStatus()**
```javascript
const handleUpdateStatus = (query) => {
  setSelectedQuery(query);
  setShowStatusModal(true);
};
```

#### 9. **handleStatusChange()**
```javascript
const handleStatusChange = async (newStatus) => {
  if (selectedQuery) {
    await updateQueryStatus(selectedQuery.id, newStatus);
    setShowStatusModal(false);
    setSelectedQuery(null);
  }
};
```

### UI/UX Features

#### 1. **Query List Display**
- **Card Layout**: Clean card-based layout
- **Status Indicators**: Color-coded status badges
- **Quick Actions**: Status update and view buttons
- **Responsive Design**: Mobile-friendly layout

#### 2. **Status Filtering**
- **Filter Tabs**: Easy status filtering
- **Status Counts**: Show count for each status
- **All Queries**: View all queries option
- **Active Filters**: Highlight active filter

#### 3. **Query Details**
- **Full Information**: Complete query details
- **Contact Details**: Name, email, phone
- **Message Content**: Full message display
- **Timestamps**: Creation and update times

#### 4. **Status Management**
- **Status Dropdown**: Easy status selection
- **Status History**: Track status changes
- **Resolution Tracking**: Track resolution details
- **Admin Attribution**: Track who resolved queries

### Data Flow

#### Query Management Flow:
```
1. Admin accesses Contact Queries tab
2. fetchQueries() loads query data
3. Queries are displayed with status indicators
4. Admin filters by status
5. Admin views/updates query status
6. Changes are saved to Firebase
7. UI updates with new data
```

#### Status Update Flow:
```
1. Admin clicks "Update Status" for a query
2. Status update modal opens
3. Admin selects new status
4. updateQueryStatus() is called
5. Query is updated in Firebase
6. Local state is updated
7. UI refreshes with new status
```

### Performance Optimizations

#### 1. **Data Loading**
- **Efficient Queries**: Optimized database queries
- **Ordered Results**: Results ordered by creation date
- **Caching**: Cached query data

#### 2. **Filtering**
- **Client-side Filtering**: Fast filtering without server calls
- **Efficient Updates**: Minimal re-renders
- **Optimized State**: Efficient state management

#### 3. **UI Optimization**
- **Minimal Re-renders**: Efficient component updates
- **Optimized Components**: Optimized component rendering
- **Smooth Animations**: Smooth UI transitions

### Error Handling

#### 1. **Data Errors**
- **Missing Data**: Handle missing query data
- **Invalid Data**: Handle corrupted query data
- **Network Issues**: Handle connection problems

#### 2. **Status Errors**
- **Invalid Status**: Handle invalid status values
- **Update Failures**: Handle status update failures
- **Permission Errors**: Handle permission issues

#### 3. **User Feedback**
- **Loading States**: Visual loading indicators
- **Error Messages**: Clear error notifications
- **Success Feedback**: Confirmation messages

### Security Considerations

#### 1. **Access Control**
- **Permission-based Access**: Only authorized admins can manage queries
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all query management activities

#### 2. **Data Protection**
- **Input Sanitization**: Sanitize all input data
- **Data Privacy**: Protect contact information
- **Data Integrity**: Ensure data consistency

#### 3. **Query Security**
- **Content Security**: Secure query content display
- **Contact Protection**: Protect contact information
- **Access Control**: Control query access

### Integration Points

#### With Contact Forms:
- **Form Submissions**: Receive contact form submissions
- **Data Processing**: Process form data
- **Status Tracking**: Track query resolution

#### With Admin Dashboard:
- **Dashboard Integration**: Integrated admin interface
- **Permission System**: Role-based access control
- **Audit Trail**: Track admin actions

#### With Communication:
- **Email Integration**: Email notifications
- **Response Tracking**: Track responses to queries
- **Follow-up Management**: Manage follow-up communications

### Analytics and Insights

#### 1. **Query Metrics**
- **Total Queries**: Track total query volume
- **Status Distribution**: Analyze status distribution
- **Resolution Time**: Track resolution times

#### 2. **Performance Analysis**
- **Response Time**: Analyze response times
- **Resolution Rate**: Track resolution rates
- **Admin Performance**: Track admin performance

#### 3. **Trend Analysis**
- **Query Trends**: Analyze query trends over time
- **Status Trends**: Track status change trends
- **Volume Analysis**: Analyze query volume patterns
