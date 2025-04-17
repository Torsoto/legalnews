/**
 * Helper functions for handling subscriptions
 */

// Get the correct icon for a legal category
export const getCategoryIcon = (categoryId) => {
  const iconMap = {
    1: "briefcase-outline", // Arbeitsrecht
    2: "people-outline", // Sozialrecht
    3: "cash-outline", // Steuerrecht
    4: "shield-outline", // Verfassungsrecht
    5: "business-outline", // Verwaltungsrecht
    6: "document-text-outline", // Zivilrecht
    7: "storefront-outline", // Wirtschaftsprivatrecht
    8: "card-outline", // Finanzrecht
    9: "hand-left-outline", // Strafrecht
    10: "hammer-outline", // Verfahrensrecht
    11: "school-outline", // Jugendrechtliche Vorschriften
  };
  
  return iconMap[categoryId] || "document-outline";
};

// Get description for a jurisdiction
export const getJurisdictionDescription = (jurisdictionId) => {
  const descriptionMap = {
    "BR": "Gesetze und Verordnungen auf Bundesebene",
    "LR": "Gesetze und Verordnungen der Bundesländer",
    "EU": "Rechtsakte der Europäischen Union"
  };
  
  return descriptionMap[jurisdictionId] || "";
};

// Check if Landesrecht is selected
export const isLandesrechtSelected = (selectedJurisdictions) => {
  return selectedJurisdictions.includes("LR");
};

// Get the max step based on selections
export const getMaxStep = (selectedJurisdictions) => {
  // If Landesrecht is selected, we need the Bundesländer step
  return isLandesrechtSelected(selectedJurisdictions) ? 4 : 3;
};

// Category compatibility check
export const isCategoryCompatibleWithJurisdictions = (category, selectedJurisdictions) => {
  if (selectedJurisdictions.length === 0) return true;
  
  return selectedJurisdictions.every((jId) =>
    category.compatibleJurisdictions.includes(jId)
  );
};

// Jurisdiction compatibility check
export const isJurisdictionCompatibleWithCategories = (jurisdictionId, selectedCategories, legalCategories) => {
  const selectedCategoryIds = Object.keys(selectedCategories).map((id) => parseInt(id));
  
  if (selectedCategoryIds.length === 0) return true;
  
  return selectedCategoryIds.some((categoryId) => {
    const category = legalCategories.find((c) => c.id === categoryId);
    return category.compatibleJurisdictions.includes(jurisdictionId);
  });
}; 