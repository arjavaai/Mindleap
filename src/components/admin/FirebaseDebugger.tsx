import React, { useState } from 'react';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const FirebaseDebugger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { toast } = useToast();

  const addDebugLog = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    setDebugInfo([]);
    
    try {
      addDebugLog('🔍 Testing Firebase connection...');
      
      // Test subjects collection
      const subjectsRef = collection(db, 'subjects');
      const subjectsSnapshot = await getDocs(subjectsRef);
      addDebugLog(`📚 Subjects collection: ${subjectsSnapshot.size} documents found`);
      
      subjectsSnapshot.forEach((doc) => {
        addDebugLog(`  - Subject: ${doc.id} -> ${JSON.stringify(doc.data())}`);
      });
      
      // Test questions in each subject
      for (const subjectDoc of subjectsSnapshot.docs) {
        const questionsRef = collection(db, 'subjects', subjectDoc.id, 'questions');
        const questionsSnapshot = await getDocs(questionsRef);
        addDebugLog(`📝 Questions in ${subjectDoc.data().name}: ${questionsSnapshot.size} documents`);
        
        questionsSnapshot.forEach((questionDoc) => {
          const questionData = questionDoc.data();
          addDebugLog(`    - Question: ${questionDoc.id} -> ${questionData.question?.substring(0, 50)}...`);
          addDebugLog(`      Full structure: ${JSON.stringify(questionData, null, 2)}`);
        });
      }
      
      addDebugLog('✅ Firebase connection test completed');
      
    } catch (error) {
      addDebugLog(`❌ Firebase connection error: ${error}`);
      console.error('Firebase test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSampleData = async () => {
    setIsLoading(true);
    
    try {
      addDebugLog('🔄 Adding sample data...');
      
      // Add sample subject
      const subjectRef = await addDoc(collection(db, 'subjects'), {
        name: 'Critical & Deductive Thinking',
        scheduledDay: 'Monday',
        createdAt: new Date().toISOString()
      });
      
      addDebugLog(`✅ Added subject: ${subjectRef.id}`);
      
      // Add sample questions
      const sampleQuestions = [
        {
          question: "What is the next number in the sequence: 2, 4, 8, 16, ?",
          options: {
            a: "24",
            b: "32",
            c: "30",
            d: "28"
          },
          correctOption: "b",
          explanation: "This is a geometric sequence where each number is doubled. 16 × 2 = 32.",
          createdAt: new Date().toISOString()
        },
        {
          question: "If all roses are flowers, and some flowers are red, which statement must be true?",
          options: {
            a: "All roses are red",
            b: "Some roses are red",
            c: "All flowers are roses",
            d: "Some roses may be red"
          },
          correctOption: "d",
          explanation: "From the given premises, we can only conclude that some roses may be red, not that they definitely are.",
          createdAt: new Date().toISOString()
        }
      ];
      
      for (const questionData of sampleQuestions) {
        const questionRef = await addDoc(collection(db, 'subjects', subjectRef.id, 'questions'), questionData);
        addDebugLog(`✅ Added question: ${questionRef.id}`);
      }
      
      addDebugLog('🎉 Sample data added successfully!');
      toast({
        title: "Success!",
        description: "Sample data has been added to Firebase",
      });
      
    } catch (error) {
      addDebugLog(`❌ Error adding sample data: ${error}`);
      toast({
        title: "Error",
        description: "Failed to add sample data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🔧 Firebase Debugger</h3>
      
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={testFirebaseConnection}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isLoading ? 'Testing...' : 'Test Firebase Connection'}
        </Button>
        
        <Button 
          onClick={addSampleData}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600"
        >
          {isLoading ? 'Adding...' : 'Add Sample Data'}
        </Button>
      </div>
      
      {debugInfo.length > 0 && (
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {debugInfo.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FirebaseDebugger; 