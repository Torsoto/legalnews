import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const EmptyNewsState = ({ loading, error, onRetry }) => (
  <View className="flex-1 items-center justify-center p-8">
    {!error ? (
      <View className="items-center">
        <Ionicons name="newspaper-outline" size={64} color="#ccc" />
        <Text className="text-gray-500 text-center mt-4 mb-2 text-lg font-medium">
          Keine Rechtsnews
        </Text>
        <Text className="text-gray-400 text-center mb-6">
          Derzeit sind keine aktuellen Rechtsnews verfügbar.
        </Text>
      </View>
    ) : (
      <View className="items-center">
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text className="text-red-500 text-center mt-4 mb-2 text-lg font-medium">
          Fehler beim Laden
        </Text>
        <Text className="text-gray-600 text-center mb-6">{error}</Text>
        <TouchableOpacity
          className="bg-primary px-5 py-2 rounded-lg"
          onPress={onRetry}
        >
          <Text className="text-white font-medium">Erneut versuchen</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

export default EmptyNewsState; 