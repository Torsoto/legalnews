import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PrivacyConsent = ({ isChecked, onToggle }) => {
  const navigation = useNavigation();

  return (
    <View className="my-4">
      <TouchableOpacity 
        className="flex-row items-start"
        onPress={onToggle}
      >
        <View className="mt-1 mr-2">
          <Ionicons 
            name={isChecked ? "checkbox" : "square-outline"} 
            size={20} 
            color={isChecked ? "#4F46E5" : "#9CA3AF"} 
          />
        </View>
        <View className="flex-1">
          <Text className="text-gray-600 text-sm">
            Ich stimme zu, dass meine angegebenen Daten gemäß der{' '}
            <Text 
              className="text-primary"
              onPress={() => navigation.navigate('Datenschutz')}
            >
              Datenschutzerklärung
            </Text>
            {' '}verarbeitet werden. Ich kann meine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default PrivacyConsent; 