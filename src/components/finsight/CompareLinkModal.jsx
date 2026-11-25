import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { MotiView } from "moti";
import {
  Check,
  Copy,
  Link2,
  Send,
  Share2,
  Sparkles,
  Swords,
  Users,
  X,
} from "lucide-react-native";
import {
  SAMPLE_FRIEND_INVITES,
  generateCompareLink,
  parseCompareLink,
} from "../../data/dummyPeers";

const MONOSPACE = Platform.select({ android: "monospace", ios: "Menlo" });

function formatCurrency(amount) {
  const value = Math.round(Number(amount) || 0);
  return `₹${value.toLocaleString("en-IN")}`;
}

export function CompareLinkModal({
  visible,
  onClose,
  userName = "You",
  userCategoryTotals,
  onLaunchComparison,
  availablePeers = [],
  reducedMotion = false,
}) {
  const [activeTab, setActiveTab] = useState("share"); // "share" | "friend"
  const [inputLink, setInputLink] = useState("");
  const [copied, setCopied] = useState(false);

  const comparePayload = generateCompareLink(
    { name: userName },
    userCategoryTotals,
    "58%",
  );

  const handleShareNative = async () => {
    void Haptics.selectionAsync();
    try {
      await Share.share({
        message: comparePayload.shareText,
        title: "FinSight Head-to-Head Compare",
      });
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(comparePayload.link);
      }
    } catch {
      // Fallback if clipboard native not available
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCompareInputLink = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const peer = parseCompareLink(inputLink.trim(), availablePeers);
    if (peer) {
      onClose();
      onLaunchComparison(peer);
    } else {
      Alert.alert(
        "Invalid Link or Code",
        "Please enter a valid FinSight comparison URL, code (e.g. FS-4500-USER), or friend's name.",
      );
    }
  };

  const handleSelectPeer = (friend) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onLaunchComparison(friend);
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
          testID="compare-link-modal-content"
        >
          {/* Top Handle */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.titleWrap}>
              <View style={styles.badgeRow}>
                <Link2 size={13} color="#EB001B" />
                <Text style={styles.badgeText}>PEER-TO-PEER COMPARE</Text>
              </View>
              <Text style={styles.modalTitle}>FinSight Compare Link</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressedScale]}
              hitSlop={10}
              accessibilityLabel="Close compare link modal"
            >
              <X size={18} color="#625E59" />
            </Pressable>
          </View>

          {/* Segment Controls */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tabItem, activeTab === "share" && styles.tabItemActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveTab("share");
              }}
              accessibilityRole="button"
              accessibilityLabel="My Compare Link Tab"
            >
              <Text style={[styles.tabText, activeTab === "share" && styles.tabTextActive]}>
                My Share Link
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabItem, activeTab === "friend" && styles.tabItemActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveTab("friend");
              }}
              accessibilityRole="button"
              accessibilityLabel="Compare with a Friend Tab"
            >
              <Text style={[styles.tabText, activeTab === "friend" && styles.tabTextActive]}>
                Compare a Friend
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {activeTab === "share" && (
              <View style={styles.tabContent}>
                {/* Info Callout */}
                <View style={styles.infoBanner}>
                  <Users size={16} color="#EB001B" />
                  <Text style={styles.infoBannerText}>
                    Only the Top 5 rankers are shown on the public board. Send this
                    compare link to any friend to view a head-to-head budget breakdown!
                  </Text>
                </View>

                {/* Link Box */}
                <View style={styles.linkCard}>
                  <Text style={styles.linkCardLabel}>YOUR PORTABLE COMPARE LINK</Text>
                  <View style={styles.linkDisplayBox}>
                    <Text style={styles.linkDisplayText} numberOfLines={1}>
                      {comparePayload.link}
                    </Text>
                  </View>

                  <View style={styles.snapshotRow}>
                    <View style={styles.snapshotItem}>
                      <Text style={styles.snapshotLbl}>MONTHLY SPEND</Text>
                      <Text style={styles.snapshotVal}>
                        {formatCurrency(comparePayload.total)}
                      </Text>
                    </View>
                    <View style={styles.snapshotDivider} />
                    <View style={styles.snapshotItem}>
                      <Text style={styles.snapshotLbl}>SAVINGS RATE</Text>
                      <Text style={[styles.snapshotVal, { color: "#15803D" }]}>58%</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionGroup}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.pressedScale,
                    ]}
                    onPress={handleShareNative}
                    accessibilityRole="button"
                    accessibilityLabel="Share compare link via apps"
                  >
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Share Link with Friends</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      copied && styles.secondaryBtnActive,
                      pressed && styles.pressedScale,
                    ]}
                    onPress={handleCopyLink}
                    accessibilityRole="button"
                    accessibilityLabel="Copy compare link"
                  >
                    {copied ? (
                      <Check size={16} color="#15803D" />
                    ) : (
                      <Copy size={16} color="#EB001B" />
                    )}
                    <Text
                      style={[
                        styles.secondaryBtnText,
                        copied && { color: "#15803D" },
                      ]}
                    >
                      {copied ? "Link Copied to Clipboard!" : "Copy Compare Link"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {activeTab === "friend" && (
              <View style={styles.tabContent}>
                <Text style={styles.inputLabel}>
                  PASTE FRIEND'S FINSIGHT LINK OR CODE
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://finsight.ai/compare?name=..."
                    placeholderTextColor="#94A3B8"
                    value={inputLink}
                    onChangeText={setInputLink}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.inputActionBtn,
                      pressed && styles.pressedScale,
                    ]}
                    onPress={handleCompareInputLink}
                    accessibilityRole="button"
                    accessibilityLabel="Compare with entered link"
                  >
                    <Send size={15} color="#FFFFFF" />
                  </Pressable>
                </View>

                {/* Real Cohort Peers Section */}
                <View style={styles.sampleSection}>
                  <View style={styles.sampleHeaderRow}>
                    <Sparkles size={14} color="#F79E1B" />
                    <Text style={styles.sampleHeaderTitle}>
                      COMPARE WITH REAL COHORT PEERS
                    </Text>
                  </View>
                  <Text style={styles.sampleHeaderSub}>
                    Head-to-head financial mirror battle with verified users in your city
                  </Text>

                  {(() => {
                    const peersToDisplay =
                      availablePeers && availablePeers.length > 0
                        ? availablePeers
                        : SAMPLE_FRIEND_INVITES;

                    return (
                      <View style={styles.sampleList}>
                        {peersToDisplay.map((friend) => (
                        <Pressable
                          key={friend.id}
                          testID={`sample-friend-${friend.id}`}
                          style={({ pressed }) => [
                            styles.friendCard,
                            pressed && styles.pressedScale,
                          ]}
                          onPress={() => handleSelectPeer(friend)}
                          accessibilityRole="button"
                          accessibilityLabel={`Compare with ${friend.name}`}
                        >
                          {friend.avatar ? (
                            <Image
                              source={{ uri: friend.avatar }}
                              style={styles.friendAvatar}
                            />
                          ) : (
                            <View style={[styles.friendAvatar, styles.defaultAvatar]}>
                              <Text style={styles.defaultAvatarText}>
                                {(friend.name || "U").slice(0, 2).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>{friend.name}</Text>
                            <Text style={styles.friendSub}>{friend.college || "Verified Peer"}</Text>
                            <Text style={styles.friendHabit} numberOfLines={1}>
                              💡 {friend.keyHabit}
                            </Text>
                          </View>
                          <View style={styles.friendRight}>
                            <Text style={styles.friendSpend}>
                              {formatCurrency(friend.monthlySpend)}
                            </Text>
                            <View style={styles.battleBtnPill}>
                              <Swords size={11} color="#EB001B" />
                              <Text style={styles.battleBtnPillText}>Compare</Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  );
                })()}
                </View>
              </View>
            )}
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
    maxHeight: "82%",
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
  badgeRow: {
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
  badgeText: {
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F1EE",
    borderRadius: 14,
    padding: 3,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#625E59",
  },
  tabTextActive: {
    color: "#171717",
    fontWeight: "800",
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tabContent: {
    gap: 14,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF0F1",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.25)",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#4F4C48",
    lineHeight: 17,
  },
  linkCard: {
    backgroundColor: "#F8F8F6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 15,
    gap: 10,
  },
  linkCardLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#625E59",
    letterSpacing: 0.8,
  },
  linkDisplayBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkDisplayText: {
    fontSize: 12,
    color: "#171717",
    fontFamily: MONOSPACE,
  },
  snapshotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  snapshotItem: {
    flex: 1,
    alignItems: "center",
  },
  snapshotLbl: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#625E59",
    marginBottom: 2,
  },
  snapshotVal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#171717",
    fontFamily: MONOSPACE,
  },
  snapshotDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E3E1DC",
  },
  actionGroup: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EB001B",
    borderRadius: 16,
    paddingVertical: 13,
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF0F1",
    borderRadius: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.3)",
  },
  secondaryBtnActive: {
    backgroundColor: "#EDF7EF",
    borderColor: "rgba(46, 125, 50, 0.3)",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#EB001B",
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#171717",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F8F8F6",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: "#171717",
  },
  inputActionBtn: {
    backgroundColor: "#EB001B",
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sampleSection: {
    marginTop: 10,
  },
  sampleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sampleHeaderTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#D97706",
    letterSpacing: 0.8,
  },
  sampleHeaderSub: {
    fontSize: 11.5,
    color: "#625E59",
    marginBottom: 10,
  },
  sampleList: {
    gap: 10,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 12,
    gap: 10,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#171717",
  },
  friendSub: {
    fontSize: 11,
    color: "#625E59",
    marginTop: 1,
  },
  friendHabit: {
    fontSize: 10.5,
    color: "#4F4C48",
    marginTop: 2,
  },
  friendRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  friendSpend: {
    fontSize: 13,
    fontWeight: "900",
    color: "#171717",
    fontFamily: MONOSPACE,
  },
  battleBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF0F1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.25)",
  },
  battleBtnPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EB001B",
  },
  defaultAvatar: {
    backgroundColor: "#F79E1B",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  emptyPeersCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8F8F6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    gap: 8,
  },
  emptyPeersTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171717",
    textAlign: "center",
  },
  emptyPeersSub: {
    fontSize: 11.5,
    color: "#625E59",
    textAlign: "center",
    lineHeight: 16,
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
});
