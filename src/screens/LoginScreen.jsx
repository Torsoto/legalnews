import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { persistAuth } from '../utils/auth';
import LegalFooter from '../components/LegalFooter';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await persistAuth(userCredential.user);
      // Navigation will be handled by the auth state change in App.jsx
    } catch (error) {
      Alert.alert('Error', error.message);
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
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View className="flex-1 bg-white p-6">
          <View className="mt-12 mb-10">
            <Text className="text-3xl font-bold text-gray-800">Willkommen zu</Text>
            <Text className="text-3xl font-bold text-primary">LegalNews</Text>
            <Text className="text-base text-gray-500 mt-3">Melden Sie sich an, um fortzufahren</Text>
          </View>

          <View className="flex-1">
            <View className="bg-gray-50 p-1 rounded-xl mb-6 shadow-sm">
              <TextInput
                className="p-4 text-base text-gray-800"
                placeholder="E-Mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="bg-gray-50 p-1 rounded-xl mb-3 shadow-sm">
              <TextInput
                className="p-4 text-base text-gray-800"
                placeholder="Passwort"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity className="self-end mb-8">
              <Text className="text-primary font-medium">Passwort vergessen?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-primary p-4 rounded-xl items-center shadow-md"
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Anmeldung läuft...' : 'Anmelden'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Noch kein Konto? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Registrieren')}>
                <Text className="text-primary font-bold">Registrieren</Text>
              </TouchableOpacity>
            </View>
            
            <LegalFooter />
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen; 