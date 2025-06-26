
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Database, Users, BookOpen, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  scheduledDay: string;
}

interface School {
  id: string;
  name: string;
  address?: string;
  schoolId: string;
}

const DebugTab = () => {
  const [activeSection, setActiveSection] = useState<string | null>('questions');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Question Generation State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTemplate, setQuestionTemplate] = useState('');

  // School Addition State
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');

  // User Addition State
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [generatedUser, setGeneratedUser] = useState<any>(null);

  useEffect(() => {
    fetchSubjects();
    fetchSchools();
  }, []);

  const fetchSubjects = async () => {
    try {
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsData = subjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const generateRandomQuestions = (count: number, template: string) => {
    const questions = [];
    const questionTypes = [
      { type: 'math', template: 'What is {num1} + {num2}?' },
      { type: 'math', template: 'What is {num1} × {num2}?' },
      { type: 'general', template: 'Which of the following is correct about {topic}?' },
    ];

    for (let i = 0; i < count; i++) {
      const num1 = Math.floor(Math.random() * 50) + 1;
      const num2 = Math.floor(Math.random() * 50) + 1;
      const correctAnswer = num1 + num2;
      
      const options = [
        correctAnswer,
        correctAnswer + Math.floor(Math.random() * 10) + 1,
        correctAnswer - Math.floor(Math.random() * 10) - 1,
        correctAnswer + Math.floor(Math.random() * 20) + 10
      ].sort(() => Math.random() - 0.5);

      const correctIndex = options.indexOf(correctAnswer);
      const correctOption = ['A', 'B', 'C', 'D'][correctIndex];

      questions.push({
        question: `What is ${num1} + ${num2}?`,
        options: {
          A: options[0].toString(),
          B: options[1].toString(),
          C: options[2].toString(),
          D: options[3].toString()
        },
        correctOption,
        explanation: `${num1} + ${num2} = ${correctAnswer}. This is basic addition.`
      });
    }

    return questions;
  };

  const handlePushQuestions = async () => {
    if (!selectedSubjectId) {
      toast({
        title: "Error",
        description: "Please select a subject first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const questions = generateRandomQuestions(questionCount, questionTemplate);
      
      for (const question of questions) {
        await addDoc(collection(db, 'subjects', selectedSubjectId, 'questions'), question);
      }

      toast({
        title: "Success!",
        description: `${questionCount} questions added successfully`,
      });
      
      setSelectedSubjectId('');
      setQuestionCount(10);
      setQuestionTemplate('');
    } catch (error) {
      console.error('Error adding questions:', error);
      toast({
        title: "Error",
        description: "Failed to add questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSchoolId = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleAddSchool = async () => {
    if (!schoolName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a school name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const schoolId = generateSchoolId();
      const schoolData = {
        name: schoolName,
        address: schoolAddress || '',
        schoolId,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'schools'), schoolData);
      
      toast({
        title: "Success!",
        description: `School added with ID: ${schoolId}`,
      });
      
      setSchoolName('');
      setSchoolAddress('');
      fetchSchools();
    } catch (error) {
      console.error('Error adding school:', error);
      toast({
        title: "Error",
        description: "Failed to add school",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const generateStudentId = (schoolId: string) => {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${year}${schoolId}${randomDigits}`;
  };

  const handleAddUser = async () => {
    if (!selectedSchoolId || !studentName.trim() || !studentClass) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const selectedSchool = schools.find(s => s.id === selectedSchoolId);
      const studentId = generateStudentId(selectedSchool?.schoolId || '0000');
      const password = generatePassword();

      const userData = {
        name: studentName,
        class: studentClass,
        studentId,
        password,
        schoolId: selectedSchool?.schoolId,
        schoolName: selectedSchool?.name,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'students'), userData);
      
      setGeneratedUser(userData);
      toast({
        title: "Success!",
        description: `Student added successfully`,
      });
      
      setSelectedSchoolId('');
      setStudentName('');
      setStudentClass('');
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const SectionCard = ({ id, title, icon: Icon, children }: any) => (
    <Card className="mb-4">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => toggleSection(id)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-blue-600" />
            <span>{title}</span>
          </div>
          {activeSection === id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </CardTitle>
      </CardHeader>
      {activeSection === id && (
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 font-poppins mb-2">Debug Tools</h2>
        <p className="text-gray-600">Administrative tools for data management and testing</p>
      </div>

      <div className="space-y-4">
        {/* Push Questions Section */}
        <SectionCard id="questions" title="Push Random Questions" icon={BookOpen}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Select Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.scheduledDay})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Number of Questions</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                placeholder="Enter count"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Question Template (Optional)</Label>
            <Textarea
              value={questionTemplate}
              onChange={(e) => setQuestionTemplate(e.target.value)}
              placeholder="Enter custom template or leave empty for auto-generation"
              rows={3}
            />
          </div>
          <Button 
            onClick={handlePushQuestions} 
            disabled={loading || !selectedSubjectId}
            className="w-full"
          >
            {loading ? 'Generating...' : `Generate ${questionCount} Questions`}
          </Button>
        </SectionCard>

        {/* Add Schools Section */}
        <SectionCard id="schools" title="Add Schools (Debug Entry)" icon={Database}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">School Name</Label>
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter school name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Address (Optional)</Label>
              <Input
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="Enter school address"
              />
            </div>
          </div>
          <Button 
            onClick={handleAddSchool} 
            disabled={loading || !schoolName.trim()}
            className="w-full"
          >
            {loading ? 'Adding...' : 'Add School'}
          </Button>
        </SectionCard>

        {/* Add Users Section */}
        <SectionCard id="users" title="Add Users Manually" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Select School</Label>
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name} (ID: {school.schoolId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Student Name</Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student name"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Class</Label>
            <RadioGroup value={studentClass} onValueChange={setStudentClass}>
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="8" id="class8" />
                  <Label htmlFor="class8">Class 8</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="9" id="class9" />
                  <Label htmlFor="class9">Class 9</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10" id="class10" />
                  <Label htmlFor="class10">Class 10</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <Button 
            onClick={handleAddUser} 
            disabled={loading || !selectedSchoolId || !studentName.trim() || !studentClass}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Student'}
          </Button>
          
          {generatedUser && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Student Created Successfully!</h4>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {generatedUser.name}</p>
                <p><strong>Class:</strong> {generatedUser.class}</p>
                <p><strong>Student ID:</strong> {generatedUser.studentId}</p>
                <p><strong>Password:</strong> {generatedUser.password}</p>
                <p><strong>School:</strong> {generatedUser.schoolName}</p>
              </div>
            </motion.div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default DebugTab;
