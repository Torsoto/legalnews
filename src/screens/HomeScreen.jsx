import React, { useState } from 'react';
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
    longDescription: 'Das Arbeitsrecht regelt die Rechtsbeziehungen zwischen Arbeitgebern und Arbeitnehmern sowie die Rechte und Pflichten beider Parteien. Es umfasst Themen wie Arbeitsverträge, Kündigungsschutz, Arbeitszeit, Urlaub, Entgeltfortzahlung und Arbeitsschutz.',
  },
  {
    id: 2,
    title: 'Sozialrecht',
    description: 'Neuigkeiten aus dem Bereich Sozialrecht',
    longDescription: 'Das Sozialrecht umfasst alle Rechtsnormen der sozialen Sicherheit. Dazu gehören die gesetzliche Kranken-, Renten- und Arbeitslosenversicherung, sowie Regelungen zur Sozialhilfe und anderen Sozialleistungen.',
  },
  {
    id: 3,
    title: 'Steuerrecht',
    description: 'Updates zu steuerrechtlichen Themen',
    longDescription: 'Das Steuerrecht regelt die Erhebung von Steuern durch den Staat. Es beinhaltet Vorschriften zu verschiedenen Steuerarten wie Einkommensteuer, Umsatzsteuer, Gewerbesteuer und deren Berechnung, Erhebung und Rechtsmittel.',
  },
  {
    id: 4,
    title: 'Familienrecht',
    description: 'Entwicklungen im Familienrecht',
    longDescription: 'Das Familienrecht regelt die rechtlichen Beziehungen zwischen Familienmitgliedern. Es umfasst Themen wie Ehe, Scheidung, Unterhalt, Sorgerecht, Adoption und die rechtliche Stellung von Kindern.',
  },
  {
    id: 5,
    title: 'Mietrecht',
    description: 'Aktuelle Änderungen im Mietrecht',
    longDescription: 'Das Mietrecht regelt die Rechtsbeziehungen zwischen Vermietern und Mietern. Es beinhaltet Vorschriften zu Mietverträgen, Mieterhöhungen, Kündigungen, Schönheitsreparaturen und Nebenkosten.',
  },
];

const jurisdictions = [
  { id: 'BR', label: 'Bundesrecht', color: '#4CAF50' },
  { id: 'LR', label: 'Landesrecht', color: '#2196F3' },
  { id: 'EU', label: 'EU-Recht', color: '#FFC107' },
];

const HomeScreen = ({ navigation }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [subscriptions, setSubscriptions] = useState({});
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Mock count for UI

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Anmelden');
    } catch (error) {
      Alert.alert('Fehler', error.message);
    }
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleSubscription = (categoryId, jurisdictionId) => {
    setSubscriptions(prev => {
      const key = `${categoryId}-${jurisdictionId}`;
      const newSubscriptions = { ...prev };
      
      if (newSubscriptions[key]) {
        delete newSubscriptions[key];
      } else {
        newSubscriptions[key] = true;
      }
      
      return newSubscriptions;
    });
  };

  const isSubscribed = (categoryId, jurisdictionId) => {
    return subscriptions[`${categoryId}-${jurisdictionId}`] || false;
  };

  const handleSubscribe = (category) => {
    const selectedJurisdictions = jurisdictions
      .filter(j => isSubscribed(category.id, j.id))
      .map(j => j.label);

    if (selectedJurisdictions.length === 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie mindestens einen Rechtsbereich aus.');
      return;
    }

    Alert.alert(
      'Bestätigung', 
      `Sie abonnieren ${category.title} für:\n${selectedJurisdictions.join('\n')}`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Bestätigen',
          onPress: () => {
            Alert.alert('Erfolg', `${category.title} wurde erfolgreich abonniert!`);
          },
        },
      ]
    );
  };

  const hasSelectedJurisdictions = (categoryId) => {
    return jurisdictions.some(j => isSubscribed(categoryId, j.id));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-row justify-between items-center px-5 py-4 bg-primary mt-2">
        <Text className="text-2xl font-bold text-white">Rechtsnews</Text>
        <View className="flex-row">
          <TouchableOpacity 
            className="px-4 py-2 mr-2 relative" 
            onPress={() => navigation.navigate('Benachrichtigungen')}
          >
            <Text className="text-white">📋</Text>
            {unreadNotifications > 0 && (
              <View className="absolute top-1 right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-white text-xs font-bold">{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            className="px-4 py-2" 
            onPress={handleLogout}
          >
            <Text className="text-white">Abmelden</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        <Text className="text-xl font-bold my-5">Rechtsbereiche</Text>
        
        {legalCategories.map((category) => (
          <View 
            key={category.id} 
            className="bg-gray-50 rounded-xl mb-4 border border-gray-200 overflow-hidden"
          >
            <TouchableOpacity 
              className="flex-row justify-between items-center p-5"
              onPress={() => toggleExpand(category.id)}
            >
              <View className="flex-1">
                <Text className="text-lg font-bold mb-2">{category.title}</Text>
                <Text className="text-gray-600">{category.description}</Text>
              </View>
              <Text className="text-primary ml-2">{expandedCategory === category.id ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {expandedCategory === category.id && (
              <View className="px-5 pb-5">
                <Text className="text-gray-700 mb-4">{category.longDescription}</Text>
                
                <Text className="font-bold mb-3">Verfügbare Rechtsbereiche:</Text>
                <View className="flex-row flex-wrap gap-2">
                  {jurisdictions.map((jurisdiction) => (
                    <TouchableOpacity
                      key={jurisdiction.id}
                      className={`py-2 px-4 rounded-lg flex-row items-center ${
                        isSubscribed(category.id, jurisdiction.id)
                          ? 'bg-opacity-20'
                          : 'bg-opacity-10'
                      }`}
                      style={{ 
                        backgroundColor: jurisdiction.color,
                        opacity: isSubscribed(category.id, jurisdiction.id) ? 1 : 0.7
                      }}
                      onPress={() => toggleSubscription(category.id, jurisdiction.id)}
                    >
                      <View 
                        className="w-4 h-4 rounded-full border-2 mr-2 items-center justify-center"
                        style={{ borderColor: 'white' }}
                      >
                        {isSubscribed(category.id, jurisdiction.id) && (
                          <View 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'white' }}
                          />
                        )}
                      </View>
                      <Text className="text-white font-semibold">{jurisdiction.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  className={`mt-4 py-3 px-6 rounded-lg self-start ${
                    hasSelectedJurisdictions(category.id)
                      ? 'bg-primary'
                      : 'bg-gray-300'
                  }`}
                  onPress={() => handleSubscribe(category)}
                  disabled={!hasSelectedJurisdictions(category.id)}
                >
                  <Text className="text-white font-bold">Abonnieren</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen; 