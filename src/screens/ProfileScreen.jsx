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
  ScrollView,
  FlatList,
} from 'react-native';
import { auth } from '../../config/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { clearAuth } from "../utils/auth";
import { Ionicons } from "@expo/vector-icons";
import { API } from '../constants/api';
import { get, del } from '../utils/apiClient'; // Import the authenticated API client

const ProfileScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [removingSubscription, setRemovingSubscription] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
      setEmail(auth.currentUser.email || '');
      fetchUserSubscriptions();
    }
  }, []);

  // Set up custom header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchUserSubscriptions = async () => {
    if (!auth.currentUser) return;
    
    setLoadingSubscriptions(true);
    try {
      // Use the authenticated API client
      const data = await get(`/user/subscriptions/${auth.currentUser.uid}`);
      
      if (data.success) {
        setSubscriptions(data.subscriptions);
      } else {
        throw new Error(data.message || 'Failed to fetch subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      Alert.alert('Fehler', 'Fehler beim Laden Ihrer Abonnements');
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const removeSubscription = async (category) => {
    if (!auth.currentUser) return;
    
    Alert.alert(
      'Abonnement entfernen',
      `Möchten Sie das Abonnement für "${category}" wirklich entfernen?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel'
        },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            setRemovingSubscription(true);
            try {
              // Use the authenticated API client
              const data = await del(`/user/subscriptions/${auth.currentUser.uid}/${category}`);
              
              if (data.success) {
                // Remove the subscription from local state
                setSubscriptions(prevSubscriptions => 
                  prevSubscriptions.filter(sub => sub.category !== category)
                );
                Alert.alert('Erfolg', `Abonnement für "${category}" wurde entfernt`);
              } else {
                throw new Error(data.message || 'Fehler beim Entfernen des Abonnements');
              }
            } catch (error) {
              console.error('Error removing subscription:', error);
              Alert.alert('Fehler', 'Fehler beim Entfernen des Abonnements');
            } finally {
              setRemovingSubscription(false);
            }
          }
        }
      ]
    );
  };

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

  const renderSubscriptionItem = ({ item }) => {
    const { category, types } = item;
    const activeTypes = Object.entries(types)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    
    return (
      <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold text-gray-800">{category}</Text>
          <TouchableOpacity 
            onPress={() => removeSubscription(category)}
            disabled={removingSubscription}
            className="bg-red-100 px-2 py-1 rounded-lg"
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap">
          {activeTypes.map((type) => (
            <View 
              key={type} 
              className="bg-primary/10 px-3 py-1 rounded-full mr-2 mb-1"
            >
              <Text className="text-primary font-medium">{type}</Text>
            </View>
          ))}
          {activeTypes.length === 0 && (
            <Text className="text-gray-500 italic">Keine aktiven Abonnements</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView 
      className="flex-1 bg-gray-50"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Custom Header */}
      <View className="bg-white shadow-md border-b border-gray-200">
        <View className="flex-row justify-between items-center pt-4 pb-4 px-5">
          <Text className="text-2xl font-bold text-gray-800">Profil</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={22} color="#4F46E5" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 py-4">
          {/* Profile Card */}
          <View className="bg-white rounded-2xl shadow-sm p-6 mb-5">
            <View className="flex-row items-center mb-6">
              <View className="h-16 w-16 rounded-full bg-primary/10 items-center justify-center mr-4">
                <Text className="text-primary text-xl font-bold">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View>
                <Text className="text-xl font-bold text-gray-800 mb-1">{displayName || 'Kein Name'}</Text>
                <Text className="text-gray-500">{email}</Text>
              </View>
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

          {/* Edit Actions */}
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

          {/* Subscriptions Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Meine Abonnements</Text>
              <TouchableOpacity onPress={fetchUserSubscriptions}>
                <Ionicons name="refresh" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            {loadingSubscriptions ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="text-gray-500 mt-2">Lade Abonnements...</Text>
              </View>
            ) : subscriptions.length > 0 ? (
              <FlatList
                data={subscriptions}
                renderItem={renderSubscriptionItem}
                keyExtractor={(item) => item.category}
                scrollEnabled={false}
              />
            ) : (
              <View className="bg-white p-6 rounded-xl items-center">
                <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2 text-center">
                  Sie haben noch keine Kategorien abonniert
                </Text>
                <TouchableOpacity 
                  className="mt-4 bg-primary px-4 py-2 rounded-lg"
                  onPress={() => navigation.navigate('Abonnements')}
                >
                  <Text className="text-white font-medium">Kategorien abonnieren</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
            
          {/* Logout Button */}
          <TouchableOpacity
            className="bg-red-500 p-4 rounded-xl items-center flex-row justify-center mt-auto mb-6"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Abmelden</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen; 