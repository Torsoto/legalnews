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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Benutzer registriert:', userCredential.user.email);
      navigation.replace('Home');
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
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View className="flex-1 bg-white p-6">
          <View className="mt-12 mb-10">
            <Text className="text-3xl font-bold text-gray-800">Konto erstellen</Text>
            <Text className="text-base text-gray-500 mt-3">Registrieren Sie sich, um loszulegen</Text>
          </View>

          <View className="flex-1">
            <View className="bg-gray-50 p-1 rounded-xl mb-6 shadow-sm">
              <TextInput
                className="p-4 text-base text-gray-800"
                placeholder="E-Mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View className="bg-gray-50 p-1 rounded-xl mb-6 shadow-sm">
              <TextInput
                className="p-4 text-base text-gray-800"
                placeholder="Passwort"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View className="bg-gray-50 p-1 rounded-xl mb-6 shadow-sm">
              <TextInput
                className="p-4 text-base text-gray-800"
                placeholder="Passwort bestätigen"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity 
              className="bg-primary p-4 rounded-xl items-center mt-4 shadow-md"
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Registrierung läuft...' : 'Registrieren'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Bereits ein Konto? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Anmelden')}>
                <Text className="text-primary font-bold">Anmelden</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen; 