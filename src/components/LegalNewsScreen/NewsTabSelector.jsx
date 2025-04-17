import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const NewsTabSelector = ({ 
  tabView, 
  setTabView, 
  unreadCount 
}) => {
  return (
    <View className="flex-row border-b border-gray-200 mb-2">
      <TouchableOpacity 
        className={`flex-1 py-3 ${tabView === 'all' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setTabView('all')}
      >
        <Text 
          className={`text-center font-medium ${tabView === 'all' ? 'text-primary' : 'text-gray-600'}`}
        >
          Alle News
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        className={`flex-1 py-3 flex-row justify-center items-center ${tabView === 'notifications' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setTabView('notifications')}
      >
        <Text 
          className={`text-center font-medium ${tabView === 'notifications' ? 'text-primary' : 'text-gray-600'}`}
        >
          Benachrichtigungen
        </Text>
        {unreadCount > 0 && (
          <View className="ml-1 bg-red-500 w-5 h-5 rounded-full justify-center items-center">
            <Text className="text-white text-xs font-bold">{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default NewsTabSelector; 