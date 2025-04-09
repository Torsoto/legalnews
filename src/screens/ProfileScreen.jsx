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
} from 'react-native';
import { auth } from '../../config/firebase';
import { updateProfile } from 'firebase/auth';

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <View className="flex-1 p-5">
          <View className="items-center mt-8 mb-10">
            <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
              <Text className="text-white text-4xl">
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <Text className="text-2xl font-bold">{displayName || 'Kein Name'}</Text>
            <Text className="text-gray-500 mt-2">{email}</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-500 mb-2">Anzeigename</Text>
              {isEditing ? (
                <TextInput
                  className="border border-gray-200 p-4 rounded-xl text-base"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Ihr Name"
                />
              ) : (
                <View className="border border-gray-200 p-4 rounded-xl">
                  <Text className="text-base">{displayName || 'Kein Name'}</Text>
                </View>
              )}
            </View>

            <View>
              <Text className="text-gray-500 mb-2">E-Mail</Text>
              <View className="border border-gray-200 p-4 rounded-xl">
                <Text className="text-base">{email}</Text>
              </View>
            </View>
          </View>

          <View className="mt-8">
            {isEditing ? (
              <View className="flex-row space-x-4">
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
            ) : (
              <TouchableOpacity
                className="bg-primary p-4 rounded-xl items-center"
                onPress={() => setIsEditing(true)}
              >
                <Text className="text-white font-bold">Bearbeiten</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default ProfileScreen; 