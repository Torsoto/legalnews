import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';

// Mock data for notifications - in a real app this would come from an API
const mockNotifications = [
  {
    id: 1,
    title: 'Änderung des Arbeitsrechts',
    description: 'Neue Regelungen zum Kündigungsschutz bei befristeten Arbeitsverhältnissen',
    category: 'Arbeitsrecht',
    jurisdiction: 'Bundesrecht',
    inForceDate: '2024-07-01',
    isRead: false,
  },
  {
    id: 2,
    title: 'Steuerrechtliche Anpassungen',
    description: 'Aktualisierung der Einkommensteuerrichtlinien für Kleinunternehmer',
    category: 'Steuerrecht',
    jurisdiction: 'Bundesrecht',
    inForceDate: '2024-06-15',
    isRead: true,
  },
  {
    id: 3,
    title: 'EU-Datenschutzverordnung Ergänzung',
    description: 'Neue Vorgaben zur Datenverarbeitung bei grenzüberschreitenden Dienstleistungen',
    category: 'Datenschutz',
    jurisdiction: 'EU-Recht',
    inForceDate: '2024-08-30',
    isRead: false,
  },
  {
    id: 4,
    title: 'Mietrechtsnovelle',
    description: 'Änderungen bei der Indexierung von Mieten und Betriebskosten',
    category: 'Mietrecht',
    jurisdiction: 'Bundesrecht',
    inForceDate: '2024-05-01',
    isRead: false,
  },
  {
    id: 5,
    title: 'Niederösterreichische Bauordnung',
    description: 'Anpassung der Bauvorschriften für energieeffizientes Bauen',
    category: 'Baurecht',
    jurisdiction: 'Landesrecht',
    inForceDate: '2024-09-01',
    isRead: true,
  },
];

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(mockNotifications);

  // Sort notifications by in-force date (ascending)
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(a.inForceDate) - new Date(b.inForceDate)
  );

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-row items-center px-5 py-4 bg-primary">
        <TouchableOpacity 
          className="pr-4" 
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Benachrichtigungen</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        <Text className="text-xl font-bold my-5">Sortiert nach Inkrafttreten</Text>
        
        {sortedNotifications.length === 0 ? (
          <View className="py-10 items-center">
            <Text className="text-gray-500">Keine Benachrichtigungen vorhanden</Text>
          </View>
        ) : (
          sortedNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              className={`mb-4 p-4 rounded-xl border ${notification.isRead ? 'border-gray-200 bg-gray-50' : 'border-primary bg-white'}`}
              onPress={() => markAsRead(notification.id)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center">
                  {!notification.isRead && (
                    <View className="bg-primary h-3 w-3 rounded-full mr-2 mt-1.5" />
                  )}
                  <Text className={`text-lg font-bold ${notification.isRead ? 'text-gray-700' : 'text-black'}`}>
                    {notification.title}
                  </Text>
                </View>
                {!notification.isRead && (
                  <View className="bg-primary py-1 px-2 rounded">
                    <Text className="text-white text-xs">Neu</Text>
                  </View>
                )}
              </View>
              
              <Text className="text-gray-600 mt-1 mb-2 ml-5">{notification.description}</Text>
              
              <View className="flex-row flex-wrap mt-2 ml-5">
                <View className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-2">
                  <Text className="text-xs text-gray-600">{notification.category}</Text>
                </View>
                <View className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-2">
                  <Text className="text-xs text-gray-600">{notification.jurisdiction}</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between items-center mt-2 ml-5">
                <Text className="text-gray-500 text-sm">
                  Inkrafttreten: <Text className="font-bold">{formatDate(notification.inForceDate)}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen; 