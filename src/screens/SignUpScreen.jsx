import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User registered:', userCredential.user.email);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View className="flex-1 bg-white p-5">
      <View className="mt-16 mb-10">
        <Text className="text-3xl font-bold">Create Account</Text>
        <Text className="text-base text-gray-500 mt-2">Sign up to get started</Text>
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
        <TextInput
          className="border border-gray-200 p-4 rounded-xl mb-4 text-base"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          className="bg-primary p-4 rounded-xl items-center mt-4"
          onPress={handleSignUp}
        >
          <Text className="text-white font-bold text-base">Sign Up</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-5">
          <Text className="text-gray-500">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-primary font-bold">Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SignUpScreen; 