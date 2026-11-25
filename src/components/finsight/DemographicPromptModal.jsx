import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Check, MapPin, Briefcase, Sparkles, X, ChevronRight } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { syncUserProfileDemographics } from "../../services/cohortService";

export const DEMOGRAPHICS_STORAGE_KEY = "finsight.user_demographics_v1";
export const PROMPT_DISMISSED_KEY = "finsight.demographics_prompt_dismissed_v1";

const CITIES = [
  { id: "nagpur", name: "Nagpur", state: "MH", cohortKey: "nagpur_students" },
  { id: "pune", name: "Pune", state: "MH", cohortKey: "pune_students" },
  { id: "bengaluru", name: "Bengaluru", state: "KA", cohortKey: "tech_bengaluru" },
  { id: "mumbai", name: "Mumbai", state: "MH", cohortKey: "entry_professionals" },
];

const ROLES = [
  { id: "student", label: "College Student", icon: "🎓", defaultCohort: "nagpur_students" },
  { id: "young_pro", label: "Young Professional", icon: "💼", defaultCohort: "entry_professionals" },
  { id: "freelancer", label: "Freelancer / Creator", icon: "💻", defaultCohort: "entry_professionals" },
];

const BUDGETS = [
  { id: "b1", label: "Under ₹10,000/mo" },
  { id: "b2", label: "₹10,000 – ₹25,000/mo" },
  { id: "b3", label: "₹25,000 – ₹50,000/mo" },
];

/**
 * @param {{ onCompleted?: () => void }} [props]
 */
export function DemographicPromptModal({ onCompleted } = {}) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState("nagpur");
  const [selectedRole, setSelectedRole] = useState("student");
  const [selectedBudget, setSelectedBudget] = useState("b1");
  const [step, setStep] = useState(1); // 1: City & Role, 2: Spend range

  useEffect(() => {
    async function checkFirstTime() {
      try {
        const dismissed = await AsyncStorage.getItem(PROMPT_DISMISSED_KEY);
        const existing = await AsyncStorage.getItem(DEMOGRAPHICS_STORAGE_KEY);
        if (!dismissed && !existing) {
          // Ask only once on initial login
          setVisible(true);
        }
      } catch {
        // Safe fallback
      }
    }
    checkFirstTime();
  }, []);

  const handleSkip = async () => {
    void Haptics.selectionAsync();
    try {
      await AsyncStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    } catch {}
    setVisible(false);
    onCompleted?.(null);
  };

  const handleSave = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cityObj = CITIES.find((c) => c.id === selectedCity) || CITIES[0];
    const roleObj = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

    // Determine target cohort key based on city and role
    let cohortKey = "nagpur_students";
    if (selectedRole === "young_pro" || selectedRole === "freelancer") {
      cohortKey = selectedCity === "bengaluru" ? "tech_bengaluru" : "entry_professionals";
    } else {
      cohortKey = selectedCity === "pune" ? "pune_students" : "nagpur_students";
    }

    const payload = {
      city: cityObj.name,
      cityId: cityObj.id,
      state: cityObj.state,
      role: roleObj.label,
      roleId: roleObj.id,
      budgetRange: selectedBudget,
      cohortKey,
      savedAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(DEMOGRAPHICS_STORAGE_KEY, JSON.stringify(payload));
      await AsyncStorage.setItem(PROMPT_DISMISSED_KEY, "true");
      if (user?.uid) {
        await syncUserProfileDemographics(user.uid, payload);
      }
    } catch {}

    setVisible(false);
    onCompleted?.(payload);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.topHandleBar} />

          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={styles.badgeRow}>
                <Sparkles size={13} color="#F79E1B" />
                <Text style={styles.badgeText}>PERSONALIZE YOUR BENCHMARKS</Text>
              </View>
              <Text style={styles.sheetTitle}>Where do you spend?</Text>
              <Text style={styles.sheetSub}>
                Compare your cash flow fairly against peers in your exact city and demographic.
              </Text>
            </View>
            <Pressable
              onPress={handleSkip}
              hitSlop={10}
              style={styles.closeCircle}
              accessibilityLabel="Skip personalization"
            >
              <X size={16} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Step 1: Select City */}
            <Text style={styles.sectionLabel}>1. SELECT YOUR CITY</Text>
            <View style={styles.cityGrid}>
              {CITIES.map((city) => {
                const isSelected = selectedCity === city.id;
                return (
                  <Pressable
                    key={city.id}
                    style={[styles.cityChip, isSelected && styles.cityChipSelected]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedCity(city.id);
                    }}
                  >
                    <MapPin
                      size={14}
                      color={isSelected ? "#FFFFFF" : "#64748B"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.cityChipText,
                        isSelected && styles.cityChipTextSelected,
                      ]}
                    >
                      {city.name}
                    </Text>
                    {isSelected && <Check size={13} color="#FFFFFF" style={{ marginLeft: 6 }} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Step 2: Select Occupation */}
            <Text style={styles.sectionLabel}>2. WHAT DESCRIBES YOU?</Text>
            <View style={styles.roleColumn}>
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <Pressable
                    key={role.id}
                    style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedRole(role.id);
                    }}
                  >
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                    <View style={styles.roleTextWrap}>
                      <Text
                        style={[
                          styles.roleLabel,
                          isSelected && styles.roleLabelSelected,
                        ]}
                      >
                        {role.label}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={styles.selectedDot}>
                        <Check size={12} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.unselectedDot} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Step 3: Typical Monthly Discretionary Range */}
            <Text style={styles.sectionLabel}>3. MONTHLY DISCRETIONARY BUDGET</Text>
            <View style={styles.budgetRow}>
              {BUDGETS.map((b) => {
                const isSelected = selectedBudget === b.id;
                return (
                  <Pressable
                    key={b.id}
                    style={[styles.budgetChip, isSelected && styles.budgetChipSelected]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedBudget(b.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.budgetChipText,
                        isSelected && styles.budgetChipTextSelected,
                      ]}
                    >
                      {b.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </Pressable>

            <Pressable
              style={styles.saveButton}
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Save and personalize benchmarks"
            >
              <Text style={styles.saveButtonText}>Save & Personalize</Text>
              <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#171717",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "88%",
  },
  topHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleWrap: {
    flex: 1,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F79E1B",
    letterSpacing: 0.8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 12.5,
    color: "#94A3B8",
    lineHeight: 18,
    marginTop: 3,
  },
  closeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    maxHeight: 380,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#EB001B",
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 10,
  },
  cityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cityChipSelected: {
    backgroundColor: "#EB001B",
    borderColor: "#EB001B",
  },
  cityChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#CBD5E1",
  },
  cityChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  roleColumn: {
    gap: 9,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  roleCardSelected: {
    backgroundColor: "rgba(235, 0, 27, 0.12)",
    borderColor: "#EB001B",
  },
  roleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  roleTextWrap: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#E2E8F0",
  },
  roleLabelSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  selectedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EB001B",
    alignItems: "center",
    justifyContent: "center",
  },
  unselectedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  budgetRow: {
    gap: 8,
    marginBottom: 10,
  },
  budgetChip: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  budgetChipSelected: {
    backgroundColor: "rgba(247, 158, 27, 0.14)",
    borderColor: "#F79E1B",
  },
  budgetChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  budgetChipTextSelected: {
    color: "#F79E1B",
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EB001B",
    borderRadius: 16,
    paddingVertical: 14,
    gap: 6,
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
