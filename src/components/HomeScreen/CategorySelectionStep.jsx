import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { legalCategories } from "../../constants";
import { getCategoryIcon } from "../../utils/subscriptionHelpers";
import StepIndicator from "./StepIndicator";

const CategorySelectionStep = ({
  fadeAnim,
  selectedCategories,
  toggleCategory,
  resetSubscription,
  goToNextStep,
  currentStep,
  selectedJurisdictions,
}) => {
  const isCategorySelected = (categoryId) => {
    return selectedCategories[categoryId] || false;
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
        <Text className="text-center text-lg font-bold mb-2">
          Schritt 1: Wählen Sie Ihre Rechtsbereiche
        </Text>
        <Text className="text-center text-gray-600 mb-2">
          Wählen Sie die Rechtsbereiche, über die Sie informiert werden möchten
        </Text>
        <StepIndicator currentStep={currentStep} selectedJurisdictions={selectedJurisdictions} />
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 flex-row flex-wrap justify-between">
          {legalCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              className={`mb-4 p-4 rounded-xl w-[48%] ${
                isCategorySelected(category.id)
                  ? "bg-primary"
                  : "bg-white border border-gray-200"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              }}
            >
              <View className="items-center">
                <View className="mb-2 h-10 justify-center">
                  <Ionicons
                    name={getCategoryIcon(category.id)}
                    size={24}
                    color={isCategorySelected(category.id) ? "white" : "#333"}
                  />
                </View>
                <Text
                  className={`text-center font-bold mb-1 ${
                    isCategorySelected(category.id) ? "text-white" : "text-black"
                  }`}
                >
                  {category.title}
                </Text>
                <Text
                  className={`text-center text-xs ${
                    isCategorySelected(category.id) ? "text-white" : "text-gray-600"
                  }`}
                  numberOfLines={2}
                >
                  {category.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={resetSubscription}
            className="px-5 py-2 rounded-lg border border-gray-300"
          >
            <Text className="text-gray-700 font-medium">Zurücksetzen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNextStep}
            className="px-5 py-2 rounded-lg bg-primary"
            disabled={Object.keys(selectedCategories).length === 0}
            style={{
              opacity: Object.keys(selectedCategories).length > 0 ? 1 : 0.5,
            }}
          >
            <Text className="text-white font-medium">Weiter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default CategorySelectionStep; 