import React from "react";
import { View } from "react-native";
import { isLandesrechtSelected, getMaxStep } from "../../utils/subscriptionHelpers";

const StepIndicator = ({ currentStep, selectedJurisdictions }) => {
  return (
    <View className="flex-row justify-center items-center space-x-2 mb-4">
      {[1, 2, isLandesrechtSelected(selectedJurisdictions) ? 3 : null, getMaxStep(selectedJurisdictions)]
        .filter(Boolean)
        .map((step) => (
          <View 
            key={step} 
            className={`h-2 rounded-full ${
              step === currentStep 
                ? "w-8 bg-primary" 
                : step < currentStep 
                  ? "w-8 bg-green-500" 
                  : "w-2 bg-gray-300"
            }`}
          />
        ))}
    </View>
  );
};

export default StepIndicator; 