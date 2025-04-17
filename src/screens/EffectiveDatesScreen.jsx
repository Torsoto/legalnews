import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, differenceInDays, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { API } from "../constants";
import { get } from "../utils/apiClient";

const EmptyLawsList = () => (
  <View className="flex-1 items-center justify-center p-8">
    <View className="items-center">
      <Ionicons name="timer-outline" size={64} color="#ccc" />
      <Text className="text-gray-500 text-center mt-4 mb-2 text-lg font-medium">
        Keine Gesetze mit Inkrafttretungsdatum
      </Text>
      <Text className="text-gray-400 text-center mb-6">
        Aktuell gibt es keine Gesetze mit bevorstehendem Inkrafttreten.
      </Text>
    </View>
  </View>
);

// Helper function to calculate and format time until/since effective date
const getTimeDescription = (dateString) => {
  if (!dateString) return { text: "Kein Datum", isPast: false, isToday: false, isTomorrow: false, daysDiff: null };
  
  const effectiveDate = parseISO(dateString);
  const today = new Date();
  const daysDiff = Math.abs(differenceInDays(effectiveDate, today));
  
  const isPastDate = isPast(effectiveDate);
  const isTodayDate = isToday(effectiveDate);
  const isTomorrowDate = isTomorrow(effectiveDate);
  
  let text = "";
  
  if (isTodayDate) {
    text = "Tritt heute in Kraft";
  } else if (isTomorrowDate) {
    text = "Tritt morgen in Kraft";
  } else if (isPastDate) {
    text = daysDiff === 1 
      ? "Trat gestern in Kraft" 
      : `Trat vor ${daysDiff} Tagen in Kraft`;
  } else {
    text = daysDiff === 1 
      ? "Tritt in einem Tag in Kraft" 
      : `Tritt in ${daysDiff} Tagen in Kraft`;
  }
  
  return { 
    text, 
    isPast: isPastDate, 
    isToday: isTodayDate, 
    isTomorrow: isTomorrowDate, 
    daysDiff
  };
};

// Component to render a law item with its effective date
const LawItem = ({ law, notification }) => {
  const timeInfo = getTimeDescription(law.effectiveDate);
  
  // Define colors based on time status
  const getStatusColor = () => {
    if (timeInfo.isToday) return "#FF9800"; // Orange for today
    if (timeInfo.isTomorrow) return "#2196F3"; // Blue for tomorrow
    if (timeInfo.isPast) return "#9E9E9E"; // Gray for past
    if (timeInfo.daysDiff <= 7) return "#4CAF50"; // Green for upcoming within a week
    return "#2196F3"; // Blue for far future
  };
  
  const statusColor = getStatusColor();
  
  const openConsolidatedVersion = () => {
    if (law.consolidatedVersionUrl) {
      Linking.openURL(law.consolidatedVersionUrl)
        .catch(err => {
          console.error('Error opening URL:', err);
          Alert.alert('Fehler', 'Die URL konnte nicht geöffnet werden.');
        });
    }
  };
  
  return (
    <View className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden border border-gray-100">
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-500 text-xs">{notification.jurisdiction === "LR" ? "Landesrecht" : "Bundesrecht"}</Text>
          <Text className="text-gray-500 text-xs">{law.publicationOrgan} {law.publicationNumber || "—"}</Text>
        </View>
        
        <Text className="text-lg font-medium mb-2">{law.title}</Text>
        
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#666" />
            <Text className="text-gray-600 ml-1">
              {law.effectiveDate 
                ? format(parseISO(law.effectiveDate), 'dd. MMMM yyyy', { locale: de }) 
                : "Unbekanntes Datum"}
            </Text>
          </View>
          
          <View 
            style={{ backgroundColor: statusColor }}
            className="rounded-full px-3 py-1"
          >
            <Text className="text-white text-xs font-medium">{timeInfo.text}</Text>
          </View>
        </View>
        
        {law.section && (
          <View className="mt-3 bg-gray-50 p-2 rounded">
            <Text className="text-gray-600 text-sm">{law.section}</Text>
          </View>
        )}
        
        {law.consolidatedVersionUrl && (
          <TouchableOpacity 
            className="mt-3 border-t border-gray-100 pt-3 items-center flex-row"
            onPress={openConsolidatedVersion}
          >
            <Ionicons name="open-outline" size={16} color="#2196F3" />
            <Text className="text-blue-500 ml-1">Aktuelle Fassung anzeigen</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View className="bg-gray-50 px-4 py-2 border-t border-gray-100">
        <Text className="text-gray-500 text-xs">
          BGBl: {notification.Bgblnummer || notification.id}
        </Text>
      </View>
    </View>
  );
};

const EffectiveDatesScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [upcomingLaws, setUpcomingLaws] = useState([]);
  const [pastLaws, setPastLaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadNotifications();
    
    // Add a listener for when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotifications();
    });

    return unsubscribe;
  }, [navigation]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Fetch all notifications
      const data = await get(API.ENDPOINTS.STORED_NOTIFICATIONS);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
      
      // Process notifications to extract all laws with effective dates
      setNotifications(data.notifications);
      
      // Extract all laws with effective dates
      const allLaws = [];
      data.notifications.forEach(notification => {
        if (notification.affectedLaws && notification.affectedLaws.length > 0) {
          notification.affectedLaws.forEach(law => {
            if (law.effectiveDate) {
              allLaws.push({
                law,
                notification
              });
            }
          });
        }
      });
      
      // Split laws into upcoming and past
      const today = new Date();
      const upcoming = [];
      const past = [];
      
      allLaws.forEach(item => {
        const effectiveDate = parseISO(item.law.effectiveDate);
        if (isPast(effectiveDate) && !isToday(effectiveDate)) {
          past.push(item);
        } else {
          upcoming.push(item);
        }
      });
      
      // Sort upcoming laws by closest effective date first
      upcoming.sort((a, b) => {
        return parseISO(a.law.effectiveDate) - parseISO(b.law.effectiveDate);
      });
      
      // Sort past laws by most recent first
      past.sort((a, b) => {
        return parseISO(b.law.effectiveDate) - parseISO(a.law.effectiveDate);
      });
      
      setUpcomingLaws(upcoming);
      setPastLaws(past);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLawItem = ({ item }) => (
    <LawItem law={item.law} notification={item.notification} />
  );

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text className="text-gray-500 mt-4">Inkrafttretende Gesetze werden geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentLaws = activeTab === 'upcoming' ? upcomingLaws : pastLaws;

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pb-2">
        <View className="flex-row justify-between items-center pt-1 px-4">
          <View className="flex-row items-center">
            <Ionicons name="timer-outline" size={24} color="#2196F3" />
            <Text className="text-xl font-bold ml-2">Inkrafttreten</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => loadNotifications()}
            className="p-2"
          >
            <Ionicons name="refresh-outline" size={22} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity 
          className={`flex-1 py-3 ${activeTab === 'upcoming' ? 'border-b-2 border-blue-600' : ''}`}
          onPress={() => setActiveTab('upcoming')}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name="hourglass-outline" 
              size={18} 
              color={activeTab === 'upcoming' ? "#2196F3" : "#9E9E9E"} 
            />
            <Text 
              className={`ml-1 font-medium ${activeTab === 'upcoming' ? 'text-blue-600' : 'text-gray-500'}`}
            >
              Bevorstehend ({upcomingLaws.length})
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-3 ${activeTab === 'past' ? 'border-b-2 border-blue-600' : ''}`}
          onPress={() => setActiveTab('past')}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name="checkmark-circle-outline" 
              size={18} 
              color={activeTab === 'past' ? "#2196F3" : "#9E9E9E"} 
            />
            <Text 
              className={`ml-1 font-medium ${activeTab === 'past' ? 'text-blue-600' : 'text-gray-500'}`}
            >
              In Kraft ({pastLaws.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Laws list */}
      <FlatList
        data={currentLaws}
        renderItem={renderLawItem}
        keyExtractor={(item, index) => `${item.notification.id}-${item.law.title}-${index}`}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 24,
          flexGrow: currentLaws.length === 0 ? 1 : undefined
        }}
        ListEmptyComponent={<EmptyLawsList />}
      />
    </SafeAreaView>
  );
};

export default EffectiveDatesScreen; 