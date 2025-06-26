import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface District {
  districtName: string;
  districtCode: string;
}

interface State {
  id: string;
  stateName: string;
  stateCode: string;
  districts: District[];
  createdAt: string;
}

const StateManagementTab = () => {
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isAddStateModalOpen, setIsAddStateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [viewingState, setViewingState] = useState<State | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<State | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    stateName: '',
    stateCode: '',
    districts: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setIsFetching(true);
    try {
      const statesCollection = collection(db, 'states');
      const snapshot = await getDocs(statesCollection);
      
      const fetchedStates: State[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const state: State = {
          id: doc.id,
          stateName: data.stateName || '',
          stateCode: data.stateCode || '',
          districts: data.districts || [],
          createdAt: data.createdAt || new Date().toISOString()
        };
        fetchedStates.push(state);
      });

      // Sort states by name
      fetchedStates.sort((a, b) => a.stateName.localeCompare(b.stateName));
      setStates(fetchedStates);
      console.log('✅ States loaded:', fetchedStates.length);
    } catch (error) {
      console.error('❌ Error fetching states:', error);
      toast({
        title: "Error",
        description: "Failed to fetch states",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({
      stateName: '',
      stateCode: '',
      districts: ''
    });
  };

  const processDistricts = (districtsText: string): District[] => {
    const lines = districtsText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length > 99) {
      toast({
        title: "Validation Error",
        description: "Maximum 99 districts allowed per state",
        variant: "destructive"
      });
      return [];
    }

    return lines.map((districtName, index) => ({
      districtName: districtName.trim(),
      districtCode: String(index + 1).padStart(2, '0')
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.stateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a state name",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.stateCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a state code",
        variant: "destructive"
      });
      return false;
    }

    // Validate state code format (2-3 characters, letters only)
    if (!/^[A-Z]{2,3}$/.test(formData.stateCode.trim().toUpperCase())) {
      toast({
        title: "Validation Error",
        description: "State code must be 2-3 uppercase letters (e.g., AP, TS, UP)",
        variant: "destructive"
      });
      return false;
    }

    // Check for duplicate state codes (excluding current state when editing)
    const existingStateCode = states.find(state => 
      state.stateCode.toUpperCase() === formData.stateCode.trim().toUpperCase() && 
      state.id !== editingState?.id
    );
    if (existingStateCode) {
      toast({
        title: "Validation Error",
        description: "State code already exists. Please use a unique state code.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.districts.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one district",
        variant: "destructive"
      });
      return false;
    }

    const districts = processDistricts(formData.districts);
    if (districts.length === 0) {
      return false;
    }

    // Check for duplicate district names
    const districtNames = districts.map(d => d.districtName.toLowerCase());
    const uniqueNames = new Set(districtNames);
    if (uniqueNames.size !== districtNames.length) {
      toast({
        title: "Validation Error",
        description: "Duplicate district names found. Please ensure all districts are unique.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleAddState = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const districts = processDistricts(formData.districts);
      
      const stateData = {
        stateName: formData.stateName.trim(),
        stateCode: formData.stateCode.trim().toUpperCase(),
        districts: districts,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'states'), stateData);
      
      const newState: State = {
        id: docRef.id,
        ...stateData
      };

      setStates(prev => [...prev, newState].sort((a, b) => a.stateName.localeCompare(b.stateName)));
      setIsAddStateModalOpen(false);
      resetForm();

      toast({
        title: "Success! 🎉",
        description: `State "${stateData.stateName}" with ${districts.length} districts added successfully`,
      });
    } catch (error) {
      console.error('Error adding state:', error);
      toast({
        title: "Error",
        description: "Failed to add state",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditState = (state: State) => {
    setFormData({
      stateName: state.stateName,
      stateCode: state.stateCode,
      districts: state.districts.map(d => d.districtName).join('\n')
    });
    setEditingState(state);
    setIsAddStateModalOpen(true);
  };

  const handleUpdateState = async () => {
    if (!editingState || !validateForm()) return;

    setIsLoading(true);
    try {
      const districts = processDistricts(formData.districts);
      
      const stateData = {
        stateName: formData.stateName.trim(),
        stateCode: formData.stateCode.trim().toUpperCase(),
        districts: districts
      };

      await updateDoc(doc(db, 'states', editingState.id), stateData);
      
      setStates(prev => prev.map(s => 
        s.id === editingState.id 
          ? { ...s, ...stateData }
          : s
      ).sort((a, b) => a.stateName.localeCompare(b.stateName)));
      
      setIsAddStateModalOpen(false);
      setEditingState(null);
      resetForm();

      toast({
        title: "Success! ✅",
        description: `State "${stateData.stateName}" updated successfully`,
      });
    } catch (error) {
      console.error('Error updating state:', error);
      toast({
        title: "Error",
        description: "Failed to update state",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteState = async (state: State) => {
    try {
      await deleteDoc(doc(db, 'states', state.id));
      setStates(prev => prev.filter(s => s.id !== state.id));
      setDeleteConfirmation(null);

      toast({
        title: "Success",
        description: `State "${state.stateName}" deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting state:', error);
      toast({
        title: "Error",
        description: "Failed to delete state",
        variant: "destructive"
      });
    }
  };

  const getDistrictPreview = (districtsText: string) => {
    const lines = districtsText.split('\n').filter(line => line.trim() !== '');
    return lines.slice(0, 5).map((district, index) => (
      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-mono text-blue-600 font-semibold">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span>{district.trim()}</span>
      </div>
    ));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-500" />
              State and District Management
            </h2>
            <p className="text-gray-600 mt-2">
              {isFetching ? 'Loading states...' : `${states.length} states configured`}
            </p>
          </div>
          <Button
            onClick={() => setIsAddStateModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add State
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isFetching ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading states...</p>
        </div>
      ) : (
        /* States List */
        <div className="space-y-4">
          {states.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No States Added Yet</h3>
              <p className="text-gray-500 mb-6">Click "Add State" to get started with state and district management</p>
              <Button
                onClick={() => setIsAddStateModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First State
              </Button>
            </div>
          ) : (
            states.map((state, index) => (
              <motion.div
                key={state.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                      {state.stateName}
                      <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {state.stateCode}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {state.districts.length} districts configured
                    </p>
                    
                    {/* District Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {state.districts.slice(0, 6).map((district, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                            {district.districtCode}
                          </span>
                          <span className="text-gray-700">{district.districtName}</span>
                        </div>
                      ))}
                      {state.districts.length > 6 && (
                        <div className="text-sm text-gray-500 italic">
                          +{state.districts.length - 6} more districts...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 lg:ml-4 justify-end lg:justify-start flex-shrink-0">
                    <Button
                      onClick={() => setViewingState(state)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 w-8 h-8 p-0 flex items-center justify-center flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleEditState(state)}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 hover:bg-orange-50 w-8 h-8 p-0 flex items-center justify-center flex-shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setDeleteConfirmation(state)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 w-8 h-8 p-0 flex items-center justify-center flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit State Modal */}
      <Dialog open={isAddStateModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddStateModalOpen(false);
          setEditingState(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {editingState ? 'Edit State' : 'Add New State'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* State Name */}
              <div>
                <Label htmlFor="stateName" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  State Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stateName"
                  value={formData.stateName}
                  onChange={(e) => setFormData(prev => ({ ...prev, stateName: e.target.value }))}
                  placeholder="Enter state name (e.g., Andhra Pradesh)"
                  className={`mt-1 ${!formData.stateName.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                />
              </div>

              {/* State Code */}
              <div>
                <Label htmlFor="stateCode" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  State Code <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(2-3 letters)</span>
                </Label>
                <Input
                  id="stateCode"
                  value={formData.stateCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 3);
                    setFormData(prev => ({ ...prev, stateCode: value.toUpperCase() }));
                  }}
                  placeholder="Enter state code (e.g., AP, TS, UP)"
                  className={`mt-1 font-mono ${!formData.stateCode.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                  maxLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This code will be used in student ID generation
                </p>
              </div>

              {/* Districts */}
              <div>
                <Label htmlFor="districts" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Districts <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Max 99 districts)</span>
                </Label>
                <Textarea
                  id="districts"
                  value={formData.districts}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    if (lines.length <= 99) {
                      setFormData(prev => ({ ...prev, districts: e.target.value }));
                    }
                  }}
                  placeholder="Enter district names, one per line&#10;Example:&#10;Guntur&#10;Vijayawada&#10;Visakhapatnam"
                  className={`mt-1 min-h-[300px] font-mono text-sm ${!formData.districts.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.districts.split('\n').filter(line => line.trim() !== '').length} / 99 districts
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={editingState ? handleUpdateState : handleAddState}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  {isLoading ? 'Saving...' : editingState ? 'Update State' : 'Add State'}
                </Button>
                <Button
                  onClick={() => {
                    setIsAddStateModalOpen(false);
                    setEditingState(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">District Preview</h3>
              
              {formData.districts.trim() ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {getDistrictPreview(formData.districts)}
                  {formData.districts.split('\n').filter(line => line.trim() !== '').length > 5 && (
                    <div className="text-sm text-gray-500 italic pt-2 border-t">
                      +{formData.districts.split('\n').filter(line => line.trim() !== '').length - 5} more districts...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>Enter districts to see preview with auto-generated codes</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View State Modal */}
      {viewingState && (
        <Dialog open={!!viewingState} onOpenChange={() => setViewingState(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">
                {viewingState.stateName} - District Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Total Districts:</strong> {viewingState.districts.length}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {viewingState.districts.map((district, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                    <span className="font-mono text-blue-600 font-bold text-sm bg-blue-100 px-2 py-1 rounded">
                      {district.districtCode}
                    </span>
                    <span className="text-gray-800">{district.districtName}</span>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete the state <strong>"{deleteConfirmation.stateName}"</strong> and all its {deleteConfirmation.districts.length} districts?
              </p>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone and will affect any existing data linked to these locations.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setDeleteConfirmation(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteState(deleteConfirmation)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete State
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StateManagementTab; 