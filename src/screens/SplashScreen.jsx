import React, { useEffect } from 'react';
import { View, Image } from 'react-native';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Image
        source={require('../../assets/logo.png')}
        className="w-52 h-52"
        resizeMode="contain"
      />
    </View>
  );
};

export default SplashScreen; 