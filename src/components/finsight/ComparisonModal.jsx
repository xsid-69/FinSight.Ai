import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import {
  Award,
  CheckCircle2,
  Heart,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react-native";
import { calculateComparison } from "../../data/dummyPeers";

const MONOSPACE = Platform.select({ android: "monospace", ios: "Menlo" });

const CATEGORY_LABELS = {
  FOOD: { label: "Food & Dining", icon: "🍔" },
  SHOPPING: { label: "Shopping", icon: "🛍️" },
  TRAVEL: { label: "Travel & Transport", icon: "🚗" },
  ENTERTAINMENT: { label: "Entertainment", icon: "🎬" },
};

function formatCurrency(amount) {
  const value = Math.round(Number(amount) || 0);
  return `₹${value.toLocaleString("en-IN")}`;
}

export function ComparisonModal({
  visible,
  onClose,
  userCategoryTotals,
  peer,
  userDisplayName = "You",
  userAvatar,
  reducedMotion = false,
}) {
  const [cheered, setCheered] = useState(false);

  if (!peer) return null;

  const comparison = calculateComparison(userCategoryTotals, peer);
  const userIsSavingMore = comparison.spendDelta <= 0;

  const handleCheer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheered((prev) => !prev);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: reducedMotion ? 1 : 220 }}
          style={styles.modalContainer}
          testID="comparison-modal-content"
        >
          {/* Modal Handle & Header */}
          <View style={styles.handleBar} />

          <View style={styles.modalHeaderRow}>
            <View style={styles.titleWrap}>
              <View style={styles.comparisonBadge}>
                <Swords size={13} color="#EB001B" />
                <Text style={styles.comparisonBadgeText}>HEAD-TO-HEAD RANKING</Text>
              </View>
              <Text style={styles.modalTitle}>Financial Mirror Battle</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressedScale]}
              hitSlop={10}
              accessibilityLabel="Close comparison modal"
            >
              <X size={18} color="#625E59" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Versus Card Banner */}
            <View style={styles.versusCard}>
              {/* User Side */}
              <View style={styles.competitorSide}>
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={styles.competitorAvatar} />
                ) : (
                  <View style={[styles.competitorAvatar, styles.defaultAvatar]}>
                    <Text style={styles.defaultAvatarText}>YOU</Text>
                  </View>
                )}
                <Text style={styles.competitorName} numberOfLines={1}>
                  {userDisplayName}
                </Text>
                <Text style={styles.competitorSpend}>
                  {formatCurrency(comparison.userTotal)}
                </Text>
                <Text style={styles.competitorSub}>Monthly spend</Text>
              </View>

              {/* VS Emblem in center */}
              <View style={styles.vsEmblem}>
                <Zap size={14} color="#EB001B" fill="#EB001B" />
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Peer Side */}
              <View style={styles.competitorSide}>
                <Image source={{ uri: peer.avatar }} style={styles.competitorAvatar} />
                <Text style={styles.competitorName} numberOfLines={1}>
                  {peer.name}
                </Text>
                <Text style={[styles.competitorSpend, { color: "#F79E1B" }]}>
                  {formatCurrency(comparison.peerTotal)}
                </Text>
                <Text style={styles.competitorSub}>{peer.savingsRate} saved</Text>
              </View>
            </View>

            {/* Delta Verdict Banner */}
            <View
              style={[
                styles.verdictBanner,
                userIsSavingMore ? styles.verdictGreen : styles.verdictAmber,
              ]}
            >
              {userIsSavingMore ? (
                <TrendingDown size={18} color="#16A34A" />
              ) : (
                <TrendingUp size={18} color="#D97706" />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.verdictTitle,
                    { color: userIsSavingMore ? "#15803D" : "#B45309" },
                  ]}
                >
                  {userIsSavingMore
                    ? `You spend ${formatCurrency(Math.abs(comparison.spendDelta))} less per month`
                    : `${peer.name} spends ${formatCurrency(Math.abs(comparison.spendDelta))} less per month`}
                </Text>
                <Text style={styles.verdictSub}>
                  {userIsSavingMore
                    ? `Superior discipline in ${comparison.categoriesWhereUserSaves} of 4 core spending categories!`
                    : `Peer is outperforming with a disciplined ${peer.savingsRate} savings rate.`}
                </Text>
              </View>
            </View>

            {/* Category by Category Battle Breakdown */}
            <View style={styles.categorySection}>
              <Text style={styles.sectionHeaderTitle}>4-CATEGORY HEAD-TO-HEAD</Text>
              <Text style={styles.sectionHeaderSub}>
                Direct discretionary comparison against verified peer data
              </Text>

              <View style={styles.categoryList}>
                {comparison.categoryDeltas.map((cat, idx) => {
                  const meta = CATEGORY_LABELS[cat.category] || { label: cat.category, icon: "💳" };
                  const maxCat = Math.max(cat.userSpend, cat.peerSpend, 1000);
                  const userPct = Math.min(100, Math.max(8, (cat.userSpend / maxCat) * 100));
                  const peerPct = Math.min(100, Math.max(8, (cat.peerSpend / maxCat) * 100));

                  return (
                    <View key={cat.category} style={styles.catCompareRow}>
                      <View style={styles.catTopLine}>
                        <View style={styles.catNameGroup}>
                          <Text style={styles.catIcon}>{meta.icon}</Text>
                          <Text style={styles.catLabel}>{meta.label}</Text>
                        </View>
                        <View
                          style={[
                            styles.catDeltaPill,
                            cat.userWins ? styles.catDeltaGreen : styles.catDeltaAmber,
                          ]}
                        >
                          <Text
                            style={[
                              styles.catDeltaText,
                              { color: cat.userWins ? "#15803D" : "#B45309" },
                            ]}
                          >
                            {cat.userWins
                              ? cat.delta === 0
                                ? "Tied"
                                : `-${formatCurrency(Math.abs(cat.delta))}`
                              : `+${formatCurrency(cat.delta)}`}
                          </Text>
                        </View>
                      </View>

                      {/* User Bar */}
                      <View style={styles.barWrap}>
                        <View style={styles.barLabelRow}>
                          <Text style={styles.barLabelText}>You</Text>
                          <Text style={styles.barValText}>{formatCurrency(cat.userSpend)}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFillUser,
                              { width: `${userPct}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Peer Bar */}
                      <View style={styles.barWrap}>
                        <View style={styles.barLabelRow}>
                          <Text style={styles.barLabelText}>{peer.name.split(" ")[0]}</Text>
                          <Text style={[styles.barValText, { color: "#D97706" }]}>
                            {formatCurrency(cat.peerSpend)}
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFillPeer,
                              { width: `${peerPct}%` },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Key Peer Habit & Smart Recommendation */}
            <View style={styles.habitCard}>
              <View style={styles.habitTopRow}>
                <Sparkles size={16} color="#F79E1B" />
                <Text style={styles.habitHeader}>PEER DISCIPLINE BLUEPRINT</Text>
              </View>
              <Text style={styles.habitText}>"{peer.keyHabit}"</Text>
              <View style={styles.habitInsightBox}>
                <CheckCircle2 size={15} color="#EB001B" />
                <Text style={styles.habitInsightText}>{comparison.keyInsight}</Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cheerButton,
                  cheered && styles.cheerButtonActive,
                  pressed && styles.pressedScale,
                ]}
                onPress={handleCheer}
                accessibilityRole="button"
                accessibilityLabel={`Cheer for ${peer.name}`}
              >
                <Heart
                  size={16}
                  color={cheered ? "#FFFFFF" : "#EB001B"}
                  fill={cheered ? "#FFFFFF" : "none"}
                />
                <Text
                  style={[
                    styles.cheerButtonText,
                    cheered && styles.cheerButtonTextActive,
                  ]}
                >
                  {cheered ? "Cheered with FinSight 👏" : "Send Peer Cheer"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.dismissButton,
                  pressed && styles.pressedScale,
                ]}
                onPress={onClose}
              >
                <Text style={styles.dismissButtonText}>Done Comparing</Text>
              </Pressable>
            </View>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(23, 23, 23, 0.65)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    maxHeight: "88%",
    paddingBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E3E1DC",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F1EE",
  },
  titleWrap: {
    flex: 1,
  },
  comparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF0F1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  comparisonBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EB001B",
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F2F1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  versusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F8F6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 16,
    marginBottom: 14,
  },
  competitorSide: {
    flex: 1,
    alignItems: "center",
  },
  competitorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  defaultAvatar: {
    backgroundColor: "#EB001B",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  competitorName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 2,
  },
  competitorSpend: {
    fontSize: 15,
    fontWeight: "900",
    color: "#171717",
    fontFamily: MONOSPACE,
  },
  competitorSub: {
    fontSize: 11,
    color: "#625E59",
    marginTop: 1,
  },
  vsEmblem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E1DC",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  vsText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#EB001B",
    marginTop: -2,
  },
  verdictBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  verdictGreen: {
    backgroundColor: "#EDF7EF",
    borderColor: "rgba(46, 125, 50, 0.25)",
  },
  verdictAmber: {
    backgroundColor: "#FFF7E3",
    borderColor: "rgba(247, 158, 27, 0.35)",
  },
  verdictTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  verdictSub: {
    fontSize: 11.5,
    color: "#4F4C48",
    lineHeight: 16,
  },
  categorySection: {
    marginBottom: 18,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#171717",
    letterSpacing: 0.9,
  },
  sectionHeaderSub: {
    fontSize: 11.5,
    color: "#625E59",
    marginTop: 2,
    marginBottom: 12,
  },
  categoryList: {
    gap: 12,
  },
  catCompareRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 12,
  },
  catTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  catNameGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  catIcon: {
    fontSize: 14,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171717",
  },
  catDeltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  catDeltaGreen: {
    backgroundColor: "#EDF7EF",
    borderColor: "rgba(46, 125, 50, 0.25)",
  },
  catDeltaAmber: {
    backgroundColor: "#FFF7E3",
    borderColor: "rgba(247, 158, 27, 0.35)",
  },
  catDeltaText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONOSPACE,
  },
  barWrap: {
    marginBottom: 6,
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  barLabelText: {
    fontSize: 10.5,
    color: "#625E59",
    fontWeight: "600",
  },
  barValText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#171717",
    fontFamily: MONOSPACE,
  },
  barTrack: {
    height: 6,
    backgroundColor: "#F2F1EE",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFillUser: {
    height: "100%",
    backgroundColor: "#EB001B",
    borderRadius: 3,
  },
  barFillPeer: {
    height: "100%",
    backgroundColor: "#F79E1B",
    borderRadius: 3,
  },
  habitCard: {
    backgroundColor: "#FFF7E3",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(247, 158, 27, 0.3)",
    padding: 15,
    marginBottom: 20,
  },
  habitTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  habitHeader: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.8,
  },
  habitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171717",
    fontStyle: "italic",
    marginBottom: 10,
    lineHeight: 18,
  },
  habitInsightBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    borderRadius: 12,
  },
  habitInsightText: {
    flex: 1,
    fontSize: 11.5,
    color: "#4F4C48",
    lineHeight: 16,
  },
  bottomActions: {
    gap: 10,
  },
  cheerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF0F1",
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.3)",
    paddingVertical: 13,
    borderRadius: 16,
  },
  cheerButtonActive: {
    backgroundColor: "#EB001B",
    borderColor: "#EB001B",
  },
  cheerButtonText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#EB001B",
  },
  cheerButtonTextActive: {
    color: "#FFFFFF",
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#625E59",
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
});
