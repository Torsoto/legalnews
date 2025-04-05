import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const legalCategories = [
  {
    id: 1,
    title: 'Arbeitsrecht',
    description: 'Aktuelle Entwicklungen im Arbeitsrecht',
  },
  {
    id: 2,
    title: 'Sozialrecht',
    description: 'Neuigkeiten aus dem Bereich Sozialrecht',
  },
  {
    id: 3,
    title: 'Steuerrecht',
    description: 'Updates zu steuerrechtlichen Themen',
  },
  {
    id: 4,
    title: 'Familienrecht',
    description: 'Entwicklungen im Familienrecht',
  },
  {
    id: 5,
    title: 'Mietrecht',
    description: 'Aktuelle Änderungen im Mietrecht',
  },
];

const HomeScreen = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSubscribe = (category) => {
    Alert.alert('Subscribe', `Subscribing to ${category.title}`);
    // TODO: Implement subscription logic
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-row justify-between items-center px-5 py-4 bg-primary mt-2">
        <Text className="text-2xl font-bold text-white">Legal News</Text>
        <TouchableOpacity 
          className="px-4 py-2" 
          onPress={handleLogout}
        >
          <Text className="text-white">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5">
        <Text className="text-xl font-bold my-5">Rechtsbereiche</Text>
        
        {legalCategories.map((category) => (
          <View 
            key={category.id} 
            className="bg-gray-50 p-5 rounded-xl mb-4 border border-gray-200"
          >
            <Text className="text-lg font-bold mb-2">{category.title}</Text>
            <Text className="text-gray-600 mb-4">{category.description}</Text>
            <TouchableOpacity 
              className="bg-primary py-2 px-4 rounded-lg self-start"
              onPress={() => handleSubscribe(category)}
            >
              <Text className="text-white font-bold">Subscribe</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen; 