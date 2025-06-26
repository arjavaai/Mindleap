import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, School, MapPin, Hash, Check, Edit, Trash2, Upload, Filter, Table, FileDown, Search } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface District {
  districtName: string;
  districtCode: string;
}

interface State {
  id: string;
  stateName: string;
  stateCode: string;
  districts: District[];
}

interface School {
  id: string;
  name: string;
  schoolCode: string;
  districtCode: string;
  districtName: string;
  state: string;
  status: 'active' | 'inactive';
}

const SchoolsTab = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [filterState, setFilterState] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  
  const [newSchool, setNewSchool] = useState({ 
    name: '', 
    schoolCode: '', 
    districtCode: '',
    districtName: '',
    state: ''
  });
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [addedSchool, setAddedSchool] = useState<School | null>(null);
  const { toast } = useToast();

  // Get districts for the selected state in add form
  const selectedStateData = states.find(state => state.stateName === newSchool.state);
  const availableDistricts = selectedStateData?.districts || [];

  // Get districts for the selected state in filter
  const filterStateData = states.find(state => state.stateName === filterState);
  const filterDistricts = filterStateData?.districts || [];

  // Get all districts for general filtering
  const allDistricts = states.flatMap(state => 
    state.districts.map(district => ({
      ...district,
      stateName: state.stateName
    }))
  );

  useEffect(() => {
    fetchStates();
    fetchSchools();
  }, []);

  const fetchStates = async () => {
    try {
      const q = query(collection(db, 'states'), orderBy('stateName'));
      const querySnapshot = await getDocs(q);
      const statesList: State[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        statesList.push({
          id: doc.id,
          stateName: data.stateName || '',
          stateCode: data.stateCode || '',
          districts: data.districts || []
        });
      });
      console.log('States fetched:', statesList);
      setStates(statesList);
    } catch (error) {
      console.error('Error fetching states:', error);
      toast({
        title: "Error",
        description: "Failed to fetch states",
        variant: "destructive"
      });
    }
  };

  const fetchSchools = async () => {
    try {
      const q = query(collection(db, 'schools'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const schoolsList: School[] = [];
      querySnapshot.forEach((doc) => {
        schoolsList.push({ id: doc.id, ...doc.data() } as School);
      });
      console.log('Schools fetched:', schoolsList);
      setSchools(schoolsList);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schools",
        variant: "destructive"
      });
    }
  };

  const validateSchoolCode = async (schoolCode: string, excludeId?: string) => {
    const existingSchools = schools.filter(school => 
      school.schoolCode === schoolCode && 
      school.id !== excludeId &&
      school.status === 'active'
    );
    return existingSchools.length === 0;
  };

  const handleAddSchool = async () => {
    if (!newSchool.name.trim() || !newSchool.schoolCode.trim() || !newSchool.districtCode.trim() || !newSchool.state.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate school code format (3 digits)
    if (!/^\d{3}$/.test(newSchool.schoolCode)) {
      toast({
        title: "Validation Error",
        description: "School code must be exactly 3 digits",
        variant: "destructive"
      });
      return;
    }

    const isCodeAvailable = await validateSchoolCode(newSchool.schoolCode);
    if (!isCodeAvailable) {
      toast({
        title: "Validation Error",
        description: "School code already exists for an active school",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedDistrict = availableDistricts.find(d => d.districtCode === newSchool.districtCode);
      
      const docRef = await addDoc(collection(db, 'schools'), {
        name: newSchool.name.trim(),
        schoolCode: newSchool.schoolCode.trim(),
        districtCode: newSchool.districtCode.trim(),
        districtName: selectedDistrict?.districtName || newSchool.districtName,
        state: newSchool.state.trim(),
        status: 'active',
        createdAt: new Date().toISOString()
      });

      const schoolData = {
        id: docRef.id,
        name: newSchool.name.trim(),
        schoolCode: newSchool.schoolCode.trim(),
        districtCode: newSchool.districtCode.trim(),
        districtName: selectedDistrict?.districtName || newSchool.districtName,
        state: newSchool.state.trim(),
        status: 'active' as const
      };

      setAddedSchool(schoolData);
      setSchools(prev => [...prev, schoolData].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSchool({ name: '', schoolCode: '', districtCode: '', districtName: '', state: '' });
      setIsAddModalOpen(false);
      setIsSuccessModalOpen(true);

      toast({
        title: "Success!",
        description: "School added successfully",
      });
    } catch (error) {
      console.error('Error adding school:', error);
      toast({
        title: "Error",
        description: "Failed to add school",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setNewSchool({
      name: school.name,
      schoolCode: school.schoolCode,
      districtCode: school.districtCode,
      districtName: school.districtName,
      state: school.state || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSchool = async () => {
    if (!editingSchool || !newSchool.name.trim() || !newSchool.schoolCode.trim() || !newSchool.districtCode.trim() || !newSchool.state.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate school code format (3 digits)
    if (!/^\d{3}$/.test(newSchool.schoolCode)) {
      toast({
        title: "Validation Error",
        description: "School code must be exactly 3 digits",
        variant: "destructive"
      });
      return;
    }

    const isCodeAvailable = await validateSchoolCode(newSchool.schoolCode, editingSchool.id);
    if (!isCodeAvailable) {
      toast({
        title: "Validation Error",
        description: "School code already exists for another active school",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedDistrict = availableDistricts.find(d => d.districtCode === newSchool.districtCode);
      
      const schoolRef = doc(db, 'schools', editingSchool.id);
      await updateDoc(schoolRef, {
        name: newSchool.name.trim(),
        schoolCode: newSchool.schoolCode.trim(),
        districtCode: newSchool.districtCode.trim(),
        districtName: selectedDistrict?.districtName || newSchool.districtName,
        state: newSchool.state.trim(),
        updatedAt: new Date().toISOString()
      });

      const updatedSchool = {
        ...editingSchool,
        name: newSchool.name.trim(),
        schoolCode: newSchool.schoolCode.trim(),
        districtCode: newSchool.districtCode.trim(),
        districtName: selectedDistrict?.districtName || newSchool.districtName,
        state: newSchool.state.trim()
      };

      setSchools(prev => 
        prev.map(school => 
          school.id === editingSchool.id ? updatedSchool : school
        ).sort((a, b) => a.name.localeCompare(b.name))
      );

      setEditingSchool(null);
      setNewSchool({ name: '', schoolCode: '', districtCode: '', districtName: '', state: '' });
      setIsEditModalOpen(false);

      toast({
        title: "Success!",
        description: "School updated successfully",
      });
    } catch (error) {
      console.error('Error updating school:', error);
      toast({
        title: "Error",
        description: "Failed to update school",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSchoolStatus = async (school: School) => {
    try {
      const newStatus = school.status === 'active' ? 'inactive' : 'active';
      const schoolRef = doc(db, 'schools', school.id);
      await updateDoc(schoolRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setSchools(prev => 
        prev.map(s => 
          s.id === school.id ? { ...s, status: newStatus } : s
        )
      );

      toast({
        title: "Success!",
        description: `School ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating school status:', error);
      toast({
        title: "Error",
        description: "Failed to update school status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSchool = async (school: School) => {
    if (!confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'schools', school.id));
      setSchools(prev => prev.filter(s => s.id !== school.id));
      
      toast({
        title: "Success!",
        description: "School deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting school:', error);
      toast({
        title: "Error",
        description: "Failed to delete school",
        variant: "destructive"
      });
    }
  };

  // Filter schools based on search term and filters
  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.schoolCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = !filterState || filterState === 'all' || school.state === filterState;
    const matchesDistrict = !filterDistrict || filterDistrict === 'all' || school.districtCode === filterDistrict;
    
    return matchesSearch && matchesState && matchesDistrict;
  });

  const exportSchoolData = () => {
    if (filteredSchools.length === 0) {
      toast({
        title: "No Data",
        description: "No schools to export with current filters",
        variant: "destructive"
      });
      return;
    }

    const exportData = filteredSchools.map(school => ({
      'School Name': school.name,
      'School Code': school.schoolCode,
      'District Name': school.districtName,
      'District Code': school.districtCode,
      'State': school.state,
      'Status': school.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schools');
    
    const filterInfo = [];
    if (filterState) filterInfo.push(`State: ${filterState}`);
    if (filterDistrict) filterInfo.push(`District: ${filterDistricts.find(d => d.districtCode === filterDistrict)?.districtName || filterDistrict}`);
    
    const filename = `schools_export${filterInfo.length > 0 ? '_filtered' : ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    toast({
      title: "Export Successful!",
      description: `${filteredSchools.length} schools exported to ${filename}`,
    });
  };

  const clearFilters = () => {
    setFilterState('all');
    setFilterDistrict('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <School className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">School Management</h2>
            <p className="text-gray-600">Manage schools and their information</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add School
        </Button>
      </div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          </div>
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="text-sm"
          >
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* State Filter */}
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.stateName}>
                  {state.stateName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* District Filter */}
          <Select value={filterDistrict} onValueChange={setFilterDistrict}>
            <SelectTrigger>
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {(filterState === 'all' ? allDistricts : filterDistricts).map((district) => (
                <SelectItem key={district.districtCode} value={district.districtCode}>
                  {district.districtName} ({district.districtCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button 
            onClick={exportSchoolData}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            disabled={filteredSchools.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export ({filteredSchools.length})
          </Button>
        </div>
      </motion.div>

      {/* Schools Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Table className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Schools Data</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                {filteredSchools.length} schools
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <School className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{school.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{school.schoolCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {school.districtName}
                      <div className="text-xs text-gray-500">Code: {school.districtCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{school.state}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      school.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSchool(school)}
                        className="w-8 h-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSchoolStatus(school)}
                        className={`w-8 h-8 p-0 ${
                          school.status === 'active' 
                            ? 'text-red-600 hover:text-red-700 hover:border-red-300' 
                            : 'text-green-600 hover:text-green-700 hover:border-green-300'
                        }`}
                      >
                        {school.status === 'active' ? '✕' : '✓'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSchool(school)}
                        className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSchools.length === 0 && (
          <div className="text-center py-12">
            <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No schools found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || (filterState !== 'all' && filterState) || (filterDistrict !== 'all' && filterDistrict)
                ? "Try adjusting your search criteria or filters"
                : "Get started by adding your first school"}
            </p>
            {!searchTerm && (filterState === 'all' || !filterState) && (filterDistrict === 'all' || !filterDistrict) && (
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add First School
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Add School Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Add New School</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name *
              </label>
              <Input
                placeholder="Enter school name"
                value={newSchool.name}
                onChange={(e) => setNewSchool(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Code * (3 digits)
              </label>
              <Input
                placeholder="e.g., 001"
                value={newSchool.schoolCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setNewSchool(prev => ({ ...prev, schoolCode: value }));
                }}
                maxLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <Select
                value={newSchool.state}
                onValueChange={(value) => {
                  setNewSchool(prev => ({ 
                    ...prev, 
                    state: value, 
                    districtCode: '',
                    districtName: ''
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.stateName}>
                      {state.stateName} ({state.stateCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <Select
                value={newSchool.districtCode}
                onValueChange={(value) => {
                  const selectedDistrict = availableDistricts.find(d => d.districtCode === value);
                  setNewSchool(prev => ({ 
                    ...prev, 
                    districtCode: value,
                    districtName: selectedDistrict?.districtName || ''
                  }));
                }}
                disabled={!newSchool.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {availableDistricts.map((district) => (
                    <SelectItem key={district.districtCode} value={district.districtCode}>
                      {district.districtName} ({district.districtCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewSchool({ name: '', schoolCode: '', districtCode: '', districtName: '', state: '' });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSchool}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              >
                {isLoading ? 'Adding...' : 'Add School'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit School Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Edit School</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name *
              </label>
              <Input
                placeholder="Enter school name"
                value={newSchool.name}
                onChange={(e) => setNewSchool(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Code * (3 digits)
              </label>
              <Input
                placeholder="e.g., 001"
                value={newSchool.schoolCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setNewSchool(prev => ({ ...prev, schoolCode: value }));
                }}
                maxLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <Select
                value={newSchool.state}
                onValueChange={(value) => {
                  setNewSchool(prev => ({ 
                    ...prev, 
                    state: value, 
                    districtCode: '',
                    districtName: ''
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.stateName}>
                      {state.stateName} ({state.stateCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <Select
                value={newSchool.districtCode}
                onValueChange={(value) => {
                  const selectedDistrict = availableDistricts.find(d => d.districtCode === value);
                  setNewSchool(prev => ({ 
                    ...prev, 
                    districtCode: value,
                    districtName: selectedDistrict?.districtName || ''
                  }));
                }}
                disabled={!newSchool.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {availableDistricts.map((district) => (
                    <SelectItem key={district.districtCode} value={district.districtCode}>
                      {district.districtName} ({district.districtCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingSchool(null);
                  setNewSchool({ name: '', schoolCode: '', districtCode: '', districtName: '', state: '' });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSchool}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              >
                {isLoading ? 'Updating...' : 'Update School'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-600">
              <Check className="w-5 h-5" />
              <span>School Added Successfully!</span>
            </DialogTitle>
          </DialogHeader>
          {addedSchool && (
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-2">
                  <p><strong>School Name:</strong> {addedSchool.name}</p>
                  <p><strong>School Code:</strong> <span className="font-mono">{addedSchool.schoolCode}</span></p>
                  <p><strong>District:</strong> {addedSchool.districtName} ({addedSchool.districtCode})</p>
                  <p><strong>State:</strong> {addedSchool.state}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsSuccessModalOpen(false)} className="bg-green-600 hover:bg-green-700 text-white">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolsTab;
