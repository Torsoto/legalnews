import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NewsCard = ({ 
  item, 
  onPress, 
  isBookmarked, 
  onBookmarkToggle, 
  showNotificationBadge = false, 
  onDelete, 
  isInNotificationsTab, 
  isRead 
}) => {
  const [scaleAnimation] = useState(new Animated.Value(1));
  
  // Animation when bookmarking
  useEffect(() => {
    if (isBookmarked) {
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isBookmarked]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "undefined") return "Datum nicht verfügbar";
    try {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(dateString).toLocaleDateString("de-AT", options);
    } catch (error) {
      return dateString;
    }
  };

  return (
    <View className="mx-3">
      <TouchableOpacity 
        className="mb-4 rounded-xl overflow-hidden"
        style={{ 
          elevation: 5,
          backgroundColor: !isRead && showNotificationBadge && isInNotificationsTab ? "#EBF5FF" : "white",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderWidth: isBookmarked ? 2 : 1,
          borderColor: isBookmarked ? "#4CAF50" : "#e5e7eb"
        }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Card Header */}
        <View className="p-5">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-gray-800 mb-2">
                {item.title}
              </Text>
              <Text 
                className="text-gray-600"
                numberOfLines={2}
              >
                {item.description}
              </Text>
              
              {/* Consolidated version indicator moved here from footer */}
              {item.affectedLaws && item.affectedLaws.length > 0 && (
                <View className="flex-row items-center mt-3 bg-green-50 py-1.5 px-2.5 rounded-lg self-start border border-green-100">
                  <Ionicons name="link" size={14} color="#4CAF50" />
                  <Text className="text-xs text-green-700 ml-1 font-medium">Konsolidierte Fassung verfügbar</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center">
              {/* Delete button - only shown in notifications tab */}
              {isInNotificationsTab && (
                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  className="p-1 mr-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color="#FF4136"
                  />
                </TouchableOpacity>
              )}
              {/* Bookmark button */}
              <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
                <TouchableOpacity
                  onPress={() => onBookmarkToggle(item.id)}
                  className="p-1"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={isBookmarked ? '#4CAF50' : '#666'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
          
          {/* Tags and Date */}
          <View className="flex-row flex-wrap mt-3">
            {item.category && (
              <>
                {item.category.split(', ').map((category, index) => (
                  <View key={index} className="bg-blue-50 px-3 py-1 rounded-full mr-2 mb-1 border border-blue-100">
                    <Text className="text-xs text-blue-700 font-medium">
                      {category}
                    </Text>
                  </View>
                ))}
              </>
            )}
            {item.jurisdiction && (
              <View className="bg-green-50 px-3 py-1 rounded-full mr-2 mb-1 border border-green-100">
                <Text className="text-xs text-green-700 font-medium">
                  {item.jurisdiction === 'BR' ? 'Bundesrecht' : 
                  item.jurisdiction === 'LR' ? 'Landesrecht' : 
                  item.jurisdiction === 'EU' ? 'EU-Recht' : item.jurisdiction}
                </Text>
              </View>
            )}
            {item.jurisdiction === 'LR' && item.bundesland && (
              <View className="bg-purple-50 px-3 py-1 rounded-full mr-2 mb-1 border border-purple-100">
                <Text className="text-xs text-purple-700 font-medium">
                  {item.bundesland}
                </Text>
              </View>
            )}
            <View className="bg-gray-100 px-3 py-1 rounded-full mb-1 border border-gray-200">
              <Text className="text-xs text-gray-700 font-medium">
                {formatDate(item.publicationDate)}
              </Text>
            </View>
          </View>
          
          {/* "More" indicator replacing footer */}
          <View className="flex-row justify-end items-center mt-3">
            <Text className="text-sm text-primary font-medium mr-1">Mehr anzeigen</Text>
            <Ionicons name="chevron-forward" size={16} color="#2196F3" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default NewsCard; 