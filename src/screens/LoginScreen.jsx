import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in:', userCredential.user.email);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View className="flex-1 bg-white p-5">
      <View className="mt-16 mb-10">
        <Text className="text-3xl font-bold">Hello</Text>
        <Text className="text-3xl font-bold text-primary">Again!</Text>
        <Text className="text-base text-gray-500 mt-2">Welcome back you've been missed</Text>
      </View>

      <View className="flex-1">
        <TextInput
          className="border border-gray-200 p-4 rounded-xl mb-4 text-base"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className="border border-gray-200 p-4 rounded-xl mb-4 text-base"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity className="self-end mb-5">
          <Text className="text-primary">Forgot the password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-primary p-4 rounded-xl items-center"
          onPress={handleLogin}
        >
          <Text className="text-white font-bold text-base">Login</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-5">
          <Text className="text-gray-500">don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text className="text-primary font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen; 