import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NewsFilters = ({ 
  selectedFilter, 
  filterActive, 
  toggleFilter, 
  setSelectedFilter, 
  setFilterActive,
  bookmarkedNews
}) => {
  return (
    <View className="mb-2">
      {/* Main Filters Row */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="pt-2 pb-2"
      >
        {/* All filter */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: !selectedFilter && !filterActive ? "#2196F3" : "#e5e7eb",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            marginRight: 12,
            minHeight: 40,
          }}
          onPress={() => {
            setSelectedFilter(null);
            setFilterActive(false);
          }}
        >
          <Ionicons
            name="apps"
            size={16}
            color={!selectedFilter && !filterActive ? "white" : "#444"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: !selectedFilter && !filterActive ? "white" : "#444",
              fontWeight: '500',
            }}
          >
            Alle
          </Text>
        </TouchableOpacity>

        {/* Bookmarks filter */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: selectedFilter === "bookmarks" ? "#4CAF50" : "#e5e7eb",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            marginRight: 12,
            minHeight: 40,
          }}
          onPress={() => toggleFilter("bookmarks")}
        >
          <Ionicons
            name="bookmark"
            size={16}
            color={selectedFilter === "bookmarks" ? "white" : "#444"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: selectedFilter === "bookmarks" ? "white" : "#444",
              fontWeight: '500',
            }}
          >
            Lesezeichen
          </Text>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            marginLeft: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 10,
          }}>
            <Text style={{
              fontSize: 12,
              color: selectedFilter === "bookmarks" ? "white" : "#444",
            }}>
              {Object.keys(bookmarkedNews).length}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Federal law filter */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: selectedFilter === "Bundesrecht" ? "#2196F3" : "#e5e7eb",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            marginRight: 12,
            minHeight: 40,
          }}
          onPress={() => toggleFilter("Bundesrecht")}
        >
          <Ionicons
            name="business"
            size={16}
            color={selectedFilter === "Bundesrecht" ? "white" : "#444"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: selectedFilter === "Bundesrecht" ? "white" : "#444",
              fontWeight: '500',
            }}
          >
            Bundesrecht
          </Text>
        </TouchableOpacity>

        {/* State law filter */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: selectedFilter === "Landesrecht" ? "#2196F3" : "#e5e7eb",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            marginRight: 12,
            minHeight: 40,
          }}
          onPress={() => toggleFilter("Landesrecht")}
        >
          <Ionicons
            name="map"
            size={16}
            color={selectedFilter === "Landesrecht" ? "white" : "#444"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: selectedFilter === "Landesrecht" ? "white" : "#444",
              fontWeight: '500',
            }}
          >
            Landesrecht
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default NewsFilters; 