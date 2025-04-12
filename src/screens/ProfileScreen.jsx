import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { auth } from '../../config/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { clearAuth } from "../utils/auth";
import { Ionicons } from "@expo/vector-icons";

const ProfileScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
      setEmail(auth.currentUser.email || '');
    }
  }, []);

  // Set up custom header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Namen ein');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
      Alert.alert('Erfolg', 'Profil wurde aktualisiert');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Fehler', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await clearAuth();
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Fehler beim Abmelden", error.message);
    }
  };

  return (
    <SafeAreaView 
      className="flex-1 bg-gray-50"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Custom Header */}
      <View className="bg-white shadow-md border-b border-gray-200 mb-4">
        <View className="flex-row justify-between items-center pt-4 pb-4 px-5">
          <Text className="text-2xl font-bold text-gray-800">Profil</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={22} color="#4F46E5" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          style={{ flex: 1 }}
        >
          <View className="flex-1 px-5">
            <View className="bg-white rounded-2xl shadow-sm p-6 mb-5">
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-800 mb-2">{displayName || 'Kein Name'}</Text>
                <Text className="text-gray-500">{email}</Text>
              </View>

              <View className="space-y-5">
                <View>
                  <Text className="text-gray-600 font-medium mb-2">Anzeigename</Text>
                  {isEditing ? (
                    <TextInput
                      className="border border-gray-300 bg-gray-50 p-4 rounded-xl text-base"
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Ihr Name"
                    />
                  ) : (
                    <View className="bg-gray-50 p-4 rounded-xl">
                      <Text className="text-base text-gray-800">{displayName || 'Kein Name'}</Text>
                    </View>
                  )}
                </View>

                <View>
                  <Text className="text-gray-600 font-medium mb-2">E-Mail</Text>
                  <View className="bg-gray-50 p-4 rounded-xl">
                    <Text className="text-base text-gray-800">{email}</Text>
                  </View>
                </View>
              </View>
            </View>

            {isEditing ? (
              <View className="flex-row space-x-4 mb-5">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 p-4 rounded-xl items-center"
                  onPress={() => {
                    setIsEditing(false);
                    setDisplayName(auth.currentUser?.displayName || '');
                  }}
                  disabled={loading}
                >
                  <Text className="text-gray-800 font-bold">Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary p-4 rounded-xl items-center"
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold">Speichern</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
            
            <TouchableOpacity
              className="bg-red-500 p-4 rounded-xl items-center flex-row justify-center mt-auto mb-6"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Abmelden</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default ProfileScreen; 