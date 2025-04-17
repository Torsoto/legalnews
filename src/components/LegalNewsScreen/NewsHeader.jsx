import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NewsHeader = ({ 
  tabView, 
  unreadCount,
  markAllAsRead, 
  resetTestData,
  toggleSortOrder, 
  sortAscending,
  toggleSearch,
  searchActive,
  searchQuery,
  setSearchQuery 
}) => {
  const renderSearchBar = () => (
    <View className="px-3 pb-2">
      <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg">
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          className="flex-1 ml-2 text-base"
          placeholder="Suchen..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
  
  return (
    <View className="bg-white shadow-sm border-b border-gray-100">
      <View className="flex-row justify-between items-center pt-2 pb-3 px-4">
        <Text className="text-xl font-bold text-gray-800">Rechtsnews</Text>
        <View className="flex-row">
          {tabView === 'notifications' && (
            <>
              {unreadCount > 0 && (
                <TouchableOpacity 
                  className="mr-4 p-2"
                  onPress={markAllAsRead}
                >
                  <Text className="text-primary text-sm font-medium">Alle gelesen</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                className="mr-4 p-2 bg-blue-100 rounded-lg"
                onPress={resetTestData}
              >
                <Text className="text-primary text-sm font-medium">Test Refresh</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity 
            onPress={toggleSortOrder}
            className="p-2 mr-1"
          >
            <Ionicons 
              name={sortAscending ? "arrow-up" : "arrow-down"} 
              size={22} 
              color="#2196F3" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={toggleSearch}
            className="p-2"
          >
            <Ionicons name={searchActive ? "close" : "search-outline"} size={22} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search bar */}
      {searchActive && renderSearchBar()}
    </View>
  );
};

export default NewsHeader; 