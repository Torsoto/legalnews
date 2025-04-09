import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { persistAuth } from '../utils/auth';

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
        <View className="flex-1 bg-white p-5">
          <View className="mt-16 mb-10">
            <Text className="text-3xl font-bold">Willkommen</Text>
            <Text className="text-3xl font-bold text-primary">zurück!</Text>
            <Text className="text-base text-gray-500 mt-2">Schön, dass Sie wieder da sind</Text>
          </View>

          <View className="flex-1">
            <TextInput
              className="border border-gray-200 p-4 rounded-xl mb-4 text-base"
              placeholder="E-Mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              className="border border-gray-200 p-4 rounded-xl mb-4 text-base"
              placeholder="Passwort"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity className="self-end mb-5">
              <Text className="text-primary">Passwort vergessen?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-primary p-4 rounded-xl items-center"
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Anmeldung läuft...' : 'Anmelden'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-5">
              <Text className="text-gray-500">Noch kein Konto? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Registrieren')}>
                <Text className="text-primary font-bold">Registrieren</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen; 