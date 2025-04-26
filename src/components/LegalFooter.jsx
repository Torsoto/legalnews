import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LegalFooter = () => {
  const navigation = useNavigation();

  return (
    <View className="py-3 flex-row justify-center items-center">
      <TouchableOpacity 
        onPress={() => navigation.navigate('Impressum')}
        className="mx-3"
      >
        <Text className="text-primary text-sm">Impressum</Text>
      </TouchableOpacity>
      <Text className="text-gray-400">|</Text>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Datenschutz')}
        className="mx-3"
      >
        <Text className="text-primary text-sm">Datenschutzerklärung</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LegalFooter; 