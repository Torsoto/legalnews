import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ImpressumScreen = ({ navigation }) => {
  return (
    <SafeAreaView 
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#1a73e8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Impressum</Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 p-5">
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Impressum</Text>
          <Text className="text-gray-700 text-base mb-2">Gemäß § 5 E-Commerce-Gesetz (ECG) und § 25 Mediengesetz</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Unternehmensangaben</Text>
          <Text className="text-gray-700 mb-1">LegalNews GmbH</Text>
          <Text className="text-gray-700 mb-1">Musterstraße 123</Text>
          <Text className="text-gray-700 mb-1">1010 Wien</Text>
          <Text className="text-gray-700 mb-1">Österreich</Text>
          <Text className="text-gray-700 mb-4">UID-Nr: ATU12345678</Text>
          
          <Text className="text-gray-700 mb-1">Firmenbuchnummer: FN 123456a</Text>
          <Text className="text-gray-700 mb-1">Firmenbuchgericht: Handelsgericht Wien</Text>
          <Text className="text-gray-700 mb-1">Geschäftsführung: Max Mustermann</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Kontakt</Text>
          <Text className="text-gray-700 mb-1">Telefon: +43 1 234 56789</Text>
          <Text className="text-gray-700 mb-1">E-Mail: office@legalnews.at</Text>
          <Text className="text-gray-700 mb-1">Website: www.legalnews.at</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Aufsichtsbehörde</Text>
          <Text className="text-gray-700 mb-1">Magistratisches Bezirksamt für den 1. Bezirk</Text>
          <Text className="text-gray-700 mb-1">1010 Wien</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Kammer/Berufsverband</Text>
          <Text className="text-gray-700 mb-1">Wirtschaftskammer Wien</Text>
          <Text className="text-gray-700 mb-1">Fachgruppe Unternehmensberatung, Buchhaltung und Informationstechnologie</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Anwendbare Rechtsvorschriften</Text>
          <Text className="text-gray-700 mb-1">Gewerbeordnung: www.ris.bka.gv.at</Text>
          <Text className="text-gray-700 mb-1">E-Commerce-Gesetz: www.ris.bka.gv.at</Text>
        </View>
        
        <View className="mb-10">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Urheberrecht</Text>
          <Text className="text-gray-700 mb-4">
            Die Inhalte dieser App unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ImpressumScreen; 