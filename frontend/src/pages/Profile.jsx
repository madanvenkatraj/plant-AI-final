import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { User, Mail, Calendar, Activity, Edit2, Save, X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setEditName(data.name || currentUser.displayName || '');
          setEditPhotoUrl(data.profileImageUrl || currentUser.photoURL || '');
        } else {
          // If doc doesn't exist, use Auth info as fallback
          setUserData({
            name: currentUser.displayName,
            email: currentUser.email,
            totalDiagnoses: 0,
            createdAt: currentUser.metadata.creationTime
          });
          setEditName(currentUser.displayName || '');
          setEditPhotoUrl(currentUser.photoURL || '');
        }
        setLoading(false);
      }
    }
    fetchUserData();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaveLoading(true);
    try {
      // Update Auth Profile
      await updateProfile(currentUser, {
        displayName: editName,
        photoURL: editPhotoUrl
      });

      // Update Firestore Document (Create if missing)
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        name: editName,
        profileImageUrl: editPhotoUrl
      }, { merge: true });

      setUserData(prev => ({
        ...prev,
        name: editName,
        profileImageUrl: editPhotoUrl
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile: ", error);
      alert("Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plantGreen-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-xl rounded-2xl overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-r from-plantGreen-400 to-plantGreen-600"></div>
        
        <div className="relative px-6 pb-8 sm:px-10 sm:pb-12">
          <div className="flex justify-between items-end -mt-16 mb-6">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                {(isEditing ? editPhotoUrl : userData?.profileImageUrl) || currentUser?.photoURL ? (
                  <img 
                    src={(isEditing ? editPhotoUrl : userData?.profileImageUrl) || currentUser?.photoURL} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                  />
                ) : (
                  <div className="h-full w-full bg-plantGreen-100 flex items-center justify-center">
                    <User className="h-16 w-16 text-plantGreen-500" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(userData?.name || currentUser?.displayName || '');
                      setEditPhotoUrl(userData?.profileImageUrl || currentUser?.photoURL || '');
                    }}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="flex items-center px-4 py-2 bg-plantGreen-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-plantGreen-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-1" /> {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Personal Information</h3>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-plantGreen-500 focus:ring-plantGreen-500 sm:text-sm py-2 px-3 border outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Profile Image URL</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          <Camera className="h-4 w-4" />
                        </span>
                        <input 
                          type="text" 
                          value={editPhotoUrl}
                          onChange={(e) => setEditPhotoUrl(e.target.value)}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-plantGreen-500 focus:ring-plantGreen-500 sm:text-sm py-2 px-3 border outline-none"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="text-base text-gray-900">{userData?.name || currentUser?.displayName || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email Address</p>
                        <p className="text-base text-gray-900">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Account Stats</h3>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-plantGreen-500 mr-3" />
                      <span className="text-gray-700 font-medium">Total Diagnoses</span>
                    </div>
                    <span className="text-2xl font-bold text-plantGreen-600">{userData?.totalDiagnoses || 0}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="text-gray-700 font-medium">Member Since</span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
