import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  Award,
  ChevronDown,
  Check,
  Crown,
  Flame,
  Heart,
  Info,
  Link2,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react-native";

import {
  COHORT_BENCHMARKS,
  COHORT_LEADERBOARDS,
  STRICT_CATEGORIES,
  aggregateCategoryTotals,
  calculateCohortMetrics,
} from "../analytics/kdeEngine";
import { computeDynamicLeaderboard } from "../data/dummyPeers";
import { ComparisonModal } from "../components/finsight/ComparisonModal";
import { CompareLinkModal } from "../components/finsight/CompareLinkModal";
import { FinSightShell } from "../components/finsight/FinSightShell";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { subscribeToPrivateTransactions } from "../services/transactionService";
import { DEMOGRAPHICS_STORAGE_KEY } from "../components/finsight/DemographicPromptModal";

const MONOSPACE = Platform.select({ android: "monospace", ios: "Menlo" });
const DOCK_CLEARANCE = 108;

// Curated photography for cohorts and categories
const COHORT_MEDIA = {
  nagpur_students: {
    hero: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=720&q=80",
    tagline: "College living, canteens & local transit",
    peersCount: "1,420 peers",
    locationBadge: "Nagpur, MH",
  },
  pune_students: {
    hero: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=720&q=80",
    tagline: "University city, shared flats & student lifestyle",
    peersCount: "2,140 peers",
    locationBadge: "Pune, MH",
  },
  entry_professionals: {
    hero: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=720&q=80",
    tagline: "Tech corridors, rent & discretionary lifestyle",
    peersCount: "2,850 peers",
    locationBadge: "Tier-2 Metro",
  },
  tech_bengaluru: {
    hero: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=720&q=80",
    tagline: "Tech corridor, cafe workspaces & transit",
    peersCount: "3,400 peers",
    locationBadge: "Bengaluru, KA",
  },
};

const CATEGORY_MEDIA = {
  FOOD: {
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=360&q=80",
    badgeColor: "#F79E1B",
  },
  SHOPPING: {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=360&q=80",
    badgeColor: "#FF5F00",
  },
  TRAVEL: {
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=360&q=80",
    badgeColor: "#EB001B",
  },
  ENTERTAINMENT: {
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=360&q=80",
    badgeColor: "#F79E1B",
  },
};

const PEER_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
];

// Fallback spend for demonstration before bank statements are imported
const FALLBACK_CATEGORY_TOTALS = {
  FOOD: 6200,
  SHOPPING: 2400,
  TRAVEL: 1500,
  ENTERTAINMENT: 1300,
};

function formatCurrency(amount) {
  const value = Math.round(Number(amount) || 0);
  return `₹${value.toLocaleString("en-IN")}`;
}

export function CohortScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [selectedCohortId, setSelectedCohortId] = useState("nagpur_students");
  const [activeTab, setActiveTab] = useState("standing"); // "standing" | "leaderboard" | "cities"
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [realTransactions, setRealTransactions] = useState([]);
  const [hasRealTransactions, setHasRealTransactions] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [cheeredUsers, setCheeredUsers] = useState({});

  // Comparison Modal State
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedPeerForComparison, setSelectedPeerForComparison] = useState(null);

  // Compare Link Modal State
  const [compareLinkModalVisible, setCompareLinkModalVisible] = useState(false);

  // Sync with user's saved demographic if available
  useEffect(() => {
    AsyncStorage.getItem(DEMOGRAPHICS_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.cohortKey && COHORT_BENCHMARKS[parsed.cohortKey]) {
          setSelectedCohortId(parsed.cohortKey);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // AuthContext handles state
    }
  };

  const openProfileSection = (section) =>
    navigation?.navigate?.("Profile", { section });

  // Subscribe to real Firestore transactions
  useEffect(() => {
    if (!user?.uid) {
      setRealTransactions([]);
      setHasRealTransactions(false);
      return;
    }

    let isMounted = true;
    const unsubscribe = subscribeToPrivateTransactions(
      user.uid,
      ({ transactions }) => {
        if (!isMounted) return;
        if (Array.isArray(transactions) && transactions.length > 0) {
          setRealTransactions(transactions);
          setHasRealTransactions(true);
        } else {
          setRealTransactions([]);
          setHasRealTransactions(false);
        }
      },
      (error) => {
        console.warn("[CohortScreen] Transaction subscription error:", error);
      },
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [user?.uid]);

  // Aggregate user category spend
  const userCategoryTotals = useMemo(() => {
    if (hasRealTransactions && realTransactions.length > 0) {
      const agg = aggregateCategoryTotals(realTransactions);
      if (agg.hasRealData && agg.totalDiscretionary > 0) {
        return agg;
      }
    }
    return FALLBACK_CATEGORY_TOTALS;
  }, [hasRealTransactions, realTransactions]);

  const activeCohort =
    COHORT_BENCHMARKS[selectedCohortId] || COHORT_BENCHMARKS.nagpur_students;
  const cohortMedia =
    COHORT_MEDIA[selectedCohortId] || COHORT_MEDIA.nagpur_students;
  const cohortLeaderboard =
    COHORT_LEADERBOARDS[selectedCohortId] || COHORT_LEADERBOARDS.nagpur_students;

  // Compute KDE percentiles, stance, and strategies in <5ms
  const metrics = useMemo(() => {
    return calculateCohortMetrics(userCategoryTotals, activeCohort);
  }, [userCategoryTotals, activeCohort]);

  // Dynamically calculate the real user's ranking in the cohort and build strict Top 5
  const dynamicLeaderboard = useMemo(() => {
    const userDisplayName =
      user?.displayName || (user?.email ? user.email.split("@")[0] : "You");
    const realUserData = {
      name: userDisplayName,
      avatar: user?.photoURL || null,
      totalUserSpend: metrics.totalUserSpend,
      savingsRate:
        metrics.stance.type === "TOP_SAVER"
          ? "72%"
          : metrics.stance.type === "BALANCED"
            ? "54%"
            : "28%",
      location: cohortMedia.locationBadge,
      keyHabit: "FinSight verified statement tracking",
      categories: userCategoryTotals,
    };
    return computeDynamicLeaderboard(activeCohort, cohortLeaderboard, realUserData);
  }, [activeCohort, cohortLeaderboard, metrics, user, cohortMedia, userCategoryTotals]);

  const handleSelectCohort = useCallback((cohortId) => {
    void Haptics.selectionAsync();
    setSelectedCohortId(cohortId);
    setSelectorVisible(false);
  }, []);

  const handleOpenInfo = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInfoModalVisible(true);
  }, []);

  const handleCheer = useCallback((rankId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheeredUsers((prev) => ({
      ...prev,
      [rankId]: !prev[rankId],
    }));
  }, []);

  const handleOpenComparison = useCallback((peer) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPeerForComparison(peer);
    setComparisonModalVisible(true);
  }, []);

  // Compute position on the tier bar (0% to 100%)
  const tierBarValues = useMemo(() => {
    const topThreshold = activeCohort.topHandlersThreshold;
    const median = activeCohort.medianMonthlySpend;
    const userSpend = metrics.totalUserSpend;

    const maxScale = Math.max(median * 1.55, userSpend * 1.15, 12000);
    const topPct = Math.min(94, Math.max(6, (topThreshold / maxScale) * 100));
    const medianPct = Math.min(94, Math.max(6, (median / maxScale) * 100));
    const userPct = Math.min(94, Math.max(6, (userSpend / maxScale) * 100));

    return { topPct, medianPct, userPct };
  }, [activeCohort, metrics.totalUserSpend]);

  const userDisplayName =
    user?.displayName || (user?.email ? user.email.split("@")[0] : "You");

  return (
    <FinSightShell
      subtitle="Peer demographics & ranking"
      onProfile={() => navigation?.navigate?.("Profile")}
      onSettings={() => navigation?.navigate?.("Profile")}
      onNotifications={() => openProfileSection("notifications")}
      onHelp={() => openProfileSection("help")}
      onLogout={handleLogout}
    >
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + DOCK_CLEARANCE },
        ]}
        testID="cohort-scroll-view"
      >
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0.82, translateY: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: reducedMotion ? 1 : 240 }}
        >
          {/* Header Title Card in Clean FinSight White with Mastercard Accents */}
          <View style={styles.titleCard}>
            <View style={styles.titleTextGroup}>
              <Text style={styles.screenHeading}>Cohort Financial Mirror</Text>
              <Text style={styles.screenSubheading}>
                Anonymized peer benchmarks & saving targets
              </Text>
            </View>
            <Pressable
              testID="cohort-info-button"
              style={({ pressed }) => [
                styles.infoButton,
                pressed && styles.pressedScale,
              ]}
              onPress={handleOpenInfo}
              hitSlop={8}
              accessibilityLabel="About KDE Percentile Benchmarking"
            >
              <Info size={18} color="#EB001B" />
            </Pressable>
          </View>

          {/* Clean Segmented Interactive Switcher */}
          <View style={styles.segmentContainer}>
            <Pressable
              style={[
                styles.segmentItem,
                activeTab === "standing" && styles.segmentItemActive,
              ]}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveTab("standing");
              }}
              accessibilityRole="button"
              accessibilityLabel="My Standing View"
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === "standing" && styles.segmentTextActive,
                ]}
              >
                My Standing
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentItem,
                activeTab === "leaderboard" && styles.segmentItemActive,
              ]}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveTab("leaderboard");
              }}
              accessibilityRole="button"
              accessibilityLabel="Top Savers Leaderboard View"
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === "leaderboard" && styles.segmentTextActive,
                ]}
              >
                Top Savers
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentItem,
                activeTab === "cities" && styles.segmentItemActive,
              ]}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveTab("cities");
              }}
              accessibilityRole="button"
              accessibilityLabel="City Comparison View"
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === "cities" && styles.segmentTextActive,
                ]}
              >
                Cities
              </Text>
            </Pressable>
          </View>

          {/* Demographic Cohort Banner Card */}
          <Pressable
            testID="cohort-selector-trigger"
            style={({ pressed }) => [
              styles.cohortHeroCard,
              pressed && styles.pressedScale,
            ]}
            onPress={() => {
              void Haptics.selectionAsync();
              setSelectorVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Cohort: ${activeCohort.name}. Tap to change cohort.`}
          >
            <Image
              source={{ uri: cohortMedia.hero }}
              style={styles.cohortHeroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(23, 23, 23, 0.35)", "rgba(23, 23, 23, 0.88)"]}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.cohortHeroContent}>
              <View style={styles.cohortHeroTopRow}>
                <View style={styles.cohortHeroTagPill}>
                  <Users size={12} color="#F79E1B" />
                  <Text style={styles.cohortHeroTagText}>
                    {cohortMedia.locationBadge}
                  </Text>
                </View>

                <View style={styles.cohortHeroSwitchBtn}>
                  <Text style={styles.cohortHeroSwitchText}>Change City / Cohort</Text>
                  <ChevronDown size={13} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.cohortHeroInfo}>
                <Text style={styles.cohortHeroName} numberOfLines={1}>
                  {activeCohort.name}
                </Text>
                <Text style={styles.cohortHeroTagline}>
                  {cohortMedia.tagline}
                </Text>
              </View>

              <View style={styles.cohortHeroBottomRow}>
                <View style={styles.avatarStack}>
                  {PEER_AVATARS.map((uri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      style={[styles.peerAvatar, { marginLeft: idx === 0 ? 0 : -8 }]}
                    />
                  ))}
                  <View style={styles.peerAvatarBadge}>
                    <Text style={styles.peerAvatarCount}>
                      {cohortMedia.peersCount}
                    </Text>
                  </View>
                </View>

                <View style={styles.cohortMedianPill}>
                  <Text style={styles.cohortMedianLabel}>MEDIAN</Text>
                  <Text style={styles.cohortMedianValue}>
                    {formatCurrency(activeCohort.medianMonthlySpend)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Fallback notice if in actual mode with demo data */}
          {!hasRealTransactions && (
            <View style={styles.demoBanner} testID="cohort-demo-banner">
              <Sparkles size={14} color="#D97706" />
              <Text style={styles.demoBannerText}>
                Displaying demo peer benchmarks. Import statements to calculate
                live against your verified accounts.
              </Text>
            </View>
          )}

          {/* TAB 1: MY STANDING (Default View) */}
          {activeTab === "standing" && (
            <MotiView
              from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: reducedMotion ? 1 : 200 }}
            >
              {/* Hero Percentile & Standing Card — Mastercard Brand Red Gradient */}
              <LinearGradient
                colors={["#EB001B", "#D90018", "#A80014"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
                testID="cohort-hero-card"
                accessibilityRole="summary"
              >
                <View style={styles.heroGlowCircle} />

                <View style={styles.heroHeaderRow}>
                  <View style={styles.heroHeaderTitleGroup}>
                    <Trophy size={14} color="#F79E1B" />
                    <Text style={styles.heroSubtitle}>FINANCIAL MIRROR RANK</Text>
                  </View>
                  <View style={styles.kdeLiveBadge}>
                    <View style={styles.pulsingDot} />
                    <Text style={styles.kdeLiveText}>KDE ESTIMATION</Text>
                  </View>
                </View>

                <View style={styles.percentileDisplayRow}>
                  <Text
                    style={styles.percentileNumber}
                    testID="cohort-percentile-number"
                  >
                    {metrics.overallPercentile}
                    <Text style={styles.percentileOrdinal}>
                      {getOrdinalSuffix(metrics.overallPercentile)}
                    </Text>
                  </Text>
                  <Text style={styles.percentileUnit}>PERCENTILE</Text>
                </View>

                {/* Stance Status Badge */}
                <View
                  style={styles.stanceBadge}
                  testID="cohort-stance-badge"
                >
                  <Text
                    style={styles.stanceBadgeText}
                    numberOfLines={2}
                  >
                    {metrics.stance.badgeLabel}
                  </Text>
                </View>

                <Text style={styles.stanceSubtext}>
                  {metrics.stance.description}
                </Text>

                {/* Quick Metrics Bar inside Hero */}
                <View style={styles.heroStatsGrid}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatLabel}>YOUR SPEND</Text>
                    <Text style={styles.heroStatValue}>
                      {formatCurrency(metrics.totalUserSpend)}
                    </Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatLabel}>COHORT MEDIAN</Text>
                    <Text style={styles.heroStatValue}>
                      {formatCurrency(activeCohort.medianMonthlySpend)}
                    </Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatLabel}>TOP 10% CAP</Text>
                    <Text style={[styles.heroStatValue, { color: "#F79E1B" }]}>
                      {formatCurrency(activeCohort.topHandlersThreshold)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* "Where You Stand" vs. Top Handlers Comparison Bar */}
              <View style={styles.sectionCard} testID="cohort-tier-bar-card">
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Award size={16} color="#EB001B" />
                    <Text style={styles.sectionTitle}>WHERE YOU STAND</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    vs. Top 10% Money Handlers
                  </Text>
                </View>

                {/* Visual Tier Track */}
                <View style={styles.tierTrackContainer}>
                  <View style={styles.tierTrackBackground}>
                    <View
                      style={[
                        styles.tierSaverZone,
                        { width: `${tierBarValues.topPct}%` },
                      ]}
                    />
                  </View>

                  {/* Top 10% Handlers Marker */}
                  <View
                    style={[
                      styles.tierMarkerPin,
                      { left: `${tierBarValues.topPct}%` },
                    ]}
                  >
                    <View style={[styles.markerLine, { backgroundColor: "#F79E1B" }]} />
                    <View style={[styles.markerDot, { backgroundColor: "#F79E1B" }]} />
                    <Text style={[styles.markerLabel, { color: "#D97706" }]}>
                      Top 10%
                    </Text>
                    <Text style={styles.markerSubValue}>
                      {formatCurrency(activeCohort.topHandlersThreshold)}
                    </Text>
                  </View>

                  {/* Peer Median Marker */}
                  <View
                    style={[
                      styles.tierMarkerPin,
                      { left: `${tierBarValues.medianPct}%` },
                    ]}
                  >
                    <View style={[styles.markerLine, { backgroundColor: "#94A3B8" }]} />
                    <View style={[styles.markerDot, { backgroundColor: "#64748B" }]} />
                    <Text style={[styles.markerLabel, { color: "#625E59" }]}>
                      Median
                    </Text>
                    <Text style={styles.markerSubValue}>
                      {formatCurrency(activeCohort.medianMonthlySpend)}
                    </Text>
                  </View>

                  {/* User Spend Pin */}
                  <View
                    style={[
                      styles.userSpendPin,
                      { left: `${tierBarValues.userPct}%` },
                    ]}
                    testID="cohort-user-pin"
                  >
                    <View style={styles.userPinBubble}>
                      <View style={styles.userPulsingCore} />
                      <Text style={styles.userPinText}>
                        You: {formatCurrency(metrics.totalUserSpend)}
                      </Text>
                    </View>
                    <View style={styles.userPinStem} />
                  </View>
                </View>

                {/* Explanatory Target Copy */}
                <View style={styles.tierAdviceBox}>
                  {metrics.gapToTopHandlers > 0 ? (
                    <Text style={styles.tierAdviceText}>
                      To reach the{" "}
                      <Text style={styles.highlightGold}>
                        Top 10% Money Handler
                      </Text>{" "}
                      tier, aim to lower monthly discretionary expenses by{" "}
                      <Text style={styles.highlightRed}>
                        {formatCurrency(metrics.gapToTopHandlers)}
                      </Text>
                      .
                    </Text>
                  ) : (
                    <Text style={styles.tierAdviceText}>
                      🏆 You are already in the{" "}
                      <Text style={styles.highlightGold}>
                        Top 10% Money Handler
                      </Text>{" "}
                      tier! Your monthly spend is{" "}
                      <Text style={styles.highlightGold}>
                        {formatCurrency(
                          activeCohort.topHandlersThreshold - metrics.totalUserSpend,
                        )}
                      </Text>{" "}
                      below the disciplined ceiling.
                    </Text>
                  )}
                </View>
              </View>

              {/* Head-to-Head Comparison Teaser & Share Card */}
              <View style={styles.battleTeaserCard}>
                <View style={styles.battleTeaserLeft}>
                  <View style={styles.battleIconBox}>
                    <Swords size={18} color="#EB001B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.battleTeaserTitle}>Head-to-Head Mirror Battle</Text>
                    <Text style={styles.battleTeaserSub}>
                      Compare against Top 5 peers or share your compare link with friends
                    </Text>
                  </View>
                </View>
                <View style={styles.battleTeaserActionGroup}>
                  {dynamicLeaderboard.top5Leaderboard[0] && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.battleTeaserBtn,
                        pressed && styles.pressedScale,
                      ]}
                      onPress={() =>
                        handleOpenComparison(dynamicLeaderboard.top5Leaderboard[0])
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Battle #1 Saver"
                    >
                      <Text style={styles.battleTeaserBtnText}>Battle #1</Text>
                    </Pressable>
                  )}
                  <Pressable
                    testID="cohort-share-link-teaser-btn"
                    style={({ pressed }) => [
                      styles.shareLinkTeaserBtn,
                      pressed && styles.pressedScale,
                    ]}
                    onPress={() => setCompareLinkModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Share compare link"
                  >
                    <Link2 size={13} color="#EB001B" />
                    <Text style={styles.shareLinkTeaserBtnText}>Share Link</Text>
                  </Pressable>
                </View>
              </View>

              {/* Strict 4-Category Breakdown Grid */}
              <View style={styles.sectionHeaderSpaced}>
                <Text style={styles.sectionTitleDark}>
                  STRICT 4-CATEGORY BREAKDOWN
                </Text>
                <Text style={styles.sectionSubtitleDark}>
                  Your Spend vs. Cohort Median vs. Top Savers
                </Text>
              </View>

              <View style={styles.categoryGrid} testID="cohort-category-grid">
                {metrics.categoryMetrics.map((cat, idx) => (
                  <CategoryBreakdownCard
                    key={cat.category}
                    data={cat}
                    media={CATEGORY_MEDIA[cat.category]}
                    index={idx}
                    reducedMotion={reducedMotion}
                    onPress={() => {
                      void Haptics.selectionAsync();
                    }}
                  />
                ))}
              </View>

              {/* Strategy & Rank Improvement Engine Card */}
              <View
                style={styles.strategySectionCard}
                testID="cohort-strategies-card"
              >
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={18} color="#EB001B" />
                  <Text style={styles.strategySectionTitle}>
                    STRATEGIES TO IMPROVE YOUR RANK
                  </Text>
                </View>
                <Text style={styles.strategySectionSubtitle}>
                  Concrete saving actions to lower your demographic percentile
                </Text>

                <View style={styles.strategyCardsList}>
                  {metrics.strategies.map((strategy, idx) => (
                    <StrategyCard key={`${strategy.category}-${idx}`} strategy={strategy} />
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* TAB 2: TOP 5 SAVERS LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <MotiView
              from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: reducedMotion ? 1 : 200 }}
              style={styles.leaderboardContainer}
            >
              {/* Leaderboard Header Banner */}
              <View style={styles.leaderboardHero}>
                <Crown size={22} color="#F79E1B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderboardTitle}>Top Savers in {activeCohort.shortName}</Text>
                  <Text style={styles.leaderboardSubtitle}>
                    Verified top 5 savers demonstrating peak financial discipline
                  </Text>
                </View>
                <Pressable
                  testID="cohort-share-link-btn"
                  style={({ pressed }) => [
                    styles.headerShareBtn,
                    pressed && styles.pressedScale,
                  ]}
                  onPress={() => setCompareLinkModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Share your compare link"
                >
                  <Share2 size={13} color="#EB001B" />
                  <Text style={styles.headerShareBtnText}>Compare Link</Text>
                </Pressable>
              </View>

              {/* Your Personal Placement Status Card */}
              <View
                style={[
                  styles.myRankCard,
                  dynamicLeaderboard.isTop5 && styles.myRankCardTop5,
                ]}
                testID="cohort-my-placement-card"
              >
                <View
                  style={[
                    styles.myRankBadge,
                    dynamicLeaderboard.isTop5 && styles.myRankBadgeTop5,
                  ]}
                >
                  <Text style={styles.myRankNumber}>
                    #{dynamicLeaderboard.userRank}
                  </Text>
                </View>
                <View style={styles.myRankInfo}>
                  <Text style={styles.myRankName}>
                    {dynamicLeaderboard.isTop5
                      ? `🏆 You are in the Top 5!`
                      : "Your Cohort Position"}
                  </Text>
                  <Text style={styles.myRankSub}>
                    Spend: {formatCurrency(metrics.totalUserSpend)} •{" "}
                    {dynamicLeaderboard.isTop5
                      ? `Rank #${dynamicLeaderboard.userRank} in ${activeCohort.shortName}`
                      : `${formatCurrency(dynamicLeaderboard.gapToTop5)} to reach Top 5 (#5 ${dynamicLeaderboard.fifthPlace?.name})`}
                  </Text>
                </View>
                <Pressable
                  style={styles.shareIconPill}
                  onPress={() => setCompareLinkModalVisible(true)}
                  hitSlop={8}
                  accessibilityLabel="Open compare link dialog"
                >
                  <Link2 size={14} color="#EB001B" />
                </Pressable>
              </View>

              {/* Strict Top 5 Savers List */}
              <View style={styles.rankersList} testID="cohort-top5-list">
                {dynamicLeaderboard.top5Leaderboard.map((ranker) => {
                  const isCheered = Boolean(cheeredUsers[ranker.id]);
                  const isUser = ranker.isCurrentUser;

                  return (
                    <View
                      key={ranker.id}
                      style={[
                        styles.rankerCard,
                        isUser && styles.rankerCardCurrentUser,
                      ]}
                      testID={isUser ? "cohort-ranker-current-user" : `cohort-ranker-${ranker.id}`}
                    >
                      <View style={styles.rankerLeft}>
                        <View style={styles.medalCircle}>
                          <Text style={styles.medalText}>
                            {ranker.rank === 1
                              ? "🥇"
                              : ranker.rank === 2
                                ? "🥈"
                                : ranker.rank === 3
                                  ? "🥉"
                                  : `#${ranker.rank}`}
                          </Text>
                        </View>

                        {ranker.avatar ? (
                          <Image source={{ uri: ranker.avatar }} style={styles.rankerAvatar} />
                        ) : (
                          <View style={[styles.rankerAvatar, styles.userInitialsAvatar]}>
                            <Text style={styles.userInitialsText}>
                              {ranker.name.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}

                        <View style={styles.rankerMeta}>
                          <View style={styles.rankerNameRow}>
                            <Text style={styles.rankerName}>{ranker.name}</Text>
                            {isUser && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>YOU</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.rankerCollege}>{ranker.college}</Text>
                          <Text style={styles.rankerHabit} numberOfLines={1}>
                            💡 {ranker.keyHabit}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.rankerRight}>
                        <Text style={styles.rankerSpend}>{formatCurrency(ranker.monthlySpend)}</Text>
                        <View style={styles.savingsPill}>
                          <Text style={styles.savingsText}>{ranker.savingsRate} saved</Text>
                        </View>

                        {/* Interactive Compare and Cheer buttons */}
                        <View style={styles.rankerActionsRow}>
                          {!isUser ? (
                            <>
                              <Pressable
                                testID={`compare-btn-${ranker.id}`}
                                style={({ pressed }) => [
                                  styles.comparePillBtn,
                                  pressed && styles.pressedScale,
                                ]}
                                onPress={() => handleOpenComparison(ranker)}
                                accessibilityRole="button"
                                accessibilityLabel={`Compare with ${ranker.name}`}
                              >
                                <Swords size={11} color="#EB001B" />
                                <Text style={styles.comparePillText}>Compare</Text>
                              </Pressable>

                              <Pressable
                                style={[styles.cheerBtn, isCheered && styles.cheerBtnActive]}
                                onPress={() => handleCheer(ranker.id)}
                                accessibilityRole="button"
                                accessibilityLabel={`Cheer ${ranker.name}`}
                              >
                                <Heart
                                  size={11}
                                  color={isCheered ? "#FFFFFF" : "#EB001B"}
                                  fill={isCheered ? "#FFFFFF" : "none"}
                                />
                                <Text style={[styles.cheerText, isCheered && styles.cheerTextActive]}>
                                  {isCheered ? "Cheered" : "Cheer"}
                                </Text>
                              </Pressable>
                            </>
                          ) : (
                            <Pressable
                              style={styles.shareMyRankBtn}
                              onPress={() => setCompareLinkModalVisible(true)}
                            >
                              <Share2 size={11} color="#EB001B" />
                              <Text style={styles.shareMyRankBtnText}>Share</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Bottom Compare Link Invitation Footer */}
              <View style={styles.compareLinkBottomCard}>
                <View style={styles.compareLinkBottomInfo}>
                  <Users size={16} color="#EB001B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareLinkBottomTitle}>Want to compare with friends?</Text>
                    <Text style={styles.compareLinkBottomSub}>
                      Send your link to friends to compare budgets head-to-head beyond the Top 5
                    </Text>
                  </View>
                </View>
                <Pressable
                  testID="cohort-open-compare-link-bottom-btn"
                  style={({ pressed }) => [
                    styles.compareLinkBottomBtn,
                    pressed && styles.pressedScale,
                  ]}
                  onPress={() => setCompareLinkModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Invite friends to compare"
                >
                  <Link2 size={13} color="#FFFFFF" />
                  <Text style={styles.compareLinkBottomBtnText}>Compare with Friend</Text>
                </Pressable>
              </View>
            </MotiView>
          )}

          {/* TAB 3: CITY BENCHMARKS */}
          {activeTab === "cities" && (
            <MotiView
              from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: reducedMotion ? 1 : 200 }}
              style={styles.citiesContainer}
            >
              <View style={styles.citiesHeader}>
                <MapPin size={20} color="#EB001B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.citiesTitle}>Compare Across Indian Cities</Text>
                  <Text style={styles.citiesSub}>
                    See how student & young professional costs vary between Tier-1 and Tier-2 hubs
                  </Text>
                </View>
              </View>

              <View style={styles.citiesList}>
                {Object.values(COHORT_BENCHMARKS).map((cohort) => {
                  const isCurrent = cohort.id === selectedCohortId;
                  const media = COHORT_MEDIA[cohort.id] || COHORT_MEDIA.nagpur_students;
                  return (
                    <Pressable
                      key={cohort.id}
                      style={({ pressed }) => [
                        styles.cityCard,
                        isCurrent && styles.cityCardCurrent,
                        pressed && styles.pressedScale,
                      ]}
                      onPress={() => handleSelectCohort(cohort.id)}
                    >
                      <Image source={{ uri: media.hero }} style={styles.cityCardThumb} />
                      <View style={styles.cityCardBody}>
                        <View style={styles.cityCardTop}>
                          <Text style={styles.cityCardName}>{cohort.name}</Text>
                          {isCurrent && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>Active</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.cityCardRange}>{cohort.spendRange}</Text>

                        <View style={styles.cityMetricsRow}>
                          <View style={styles.cityMetricBlock}>
                            <Text style={styles.cityMetricLbl}>MEDIAN SPEND</Text>
                            <Text style={styles.cityMetricVal}>{formatCurrency(cohort.medianMonthlySpend)}</Text>
                          </View>
                          <View style={styles.cityMetricBlock}>
                            <Text style={styles.cityMetricLbl}>TOP 10% SAVERS</Text>
                            <Text style={[styles.cityMetricVal, { color: "#D97706" }]}>
                              {formatCurrency(cohort.topHandlersThreshold)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </MotiView>
          )}
        </MotiView>
      </ScrollView>

      {/* Head-to-Head Comparison Ranking Modal */}
      {comparisonModalVisible && selectedPeerForComparison && (
        <ComparisonModal
          visible={comparisonModalVisible}
          onClose={() => setComparisonModalVisible(false)}
          userCategoryTotals={userCategoryTotals}
          peer={selectedPeerForComparison}
          userDisplayName={userDisplayName}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Share & Enter Compare Link Modal */}
      {compareLinkModalVisible && (
        <CompareLinkModal
          visible={compareLinkModalVisible}
          onClose={() => setCompareLinkModalVisible(false)}
          userName={userDisplayName}
          userCategoryTotals={userCategoryTotals}
          onLaunchComparison={(peer) => {
            setSelectedPeerForComparison(peer);
            setComparisonModalVisible(true);
          }}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Cohort Selector Modal */}
      {selectorVisible && (
        <Modal
          visible={selectorVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectorVisible(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectorVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderRow}>
                  <Users size={20} color="#EB001B" />
                  <Text style={styles.modalTitle}>Select Demographic Cohort</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Compare your spend against localized, anonymized groups
                </Text>
              </View>

              <View style={styles.cohortOptionsList}>
                {Object.values(COHORT_BENCHMARKS).map((cohort) => {
                  const isSelected = cohort.id === selectedCohortId;
                  const itemMedia = COHORT_MEDIA[cohort.id] || COHORT_MEDIA.nagpur_students;
                  return (
                    <Pressable
                      key={cohort.id}
                      testID={`cohort-option-${cohort.id}`}
                      style={({ pressed }) => [
                        styles.cohortOptionRow,
                        isSelected && styles.cohortOptionRowSelected,
                        pressed && styles.pressedScale,
                      ]}
                      onPress={() => handleSelectCohort(cohort.id)}
                    >
                      <Image
                        source={{ uri: itemMedia.hero }}
                        style={styles.cohortOptionThumb}
                      />
                      <View style={styles.cohortOptionInfo}>
                        <Text
                          style={[
                            styles.cohortOptionName,
                            isSelected && styles.cohortOptionNameSelected,
                          ]}
                        >
                          {cohort.name}
                        </Text>
                        <Text style={styles.cohortOptionRange}>
                          Median: {formatCurrency(cohort.medianMonthlySpend)}/mo •{" "}
                          {cohort.spendRange}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkPill}>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* KDE Engine Educational Modal */}
      {infoModalVisible && (
        <Modal
          visible={infoModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoModalVisible(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setInfoModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderRow}>
                  <ShieldCheck size={20} color="#EB001B" />
                  <Text style={styles.modalTitle}>How KDE Percentiles Work</Text>
                </View>
              </View>
              <View style={styles.infoModalBody}>
                <Text style={styles.infoModalParagraph}>
                  The Cohort Financial Mirror uses{" "}
                  <Text style={styles.highlightRed}>
                    Kernel Density Estimation (KDE)
                  </Text>{" "}
                  over a log-normal distribution to map your spending against thousands of
                  anonymized, verified peer transactions.
                </Text>
                <Text style={styles.infoModalParagraph}>
                  • <Text style={styles.highlightWhite}>Percentile Score:</Text>{" "}
                  Calculated from 1st (lowest spenders) to 99th (highest spenders).
                </Text>
                <Text style={styles.infoModalParagraph}>
                  • <Text style={styles.highlightGold}>Top 10% Handlers:</Text>{" "}
                  Represents the most disciplined savers in your peer group.
                </Text>
                <Text style={styles.infoModalParagraph}>
                  • <Text style={styles.highlightWhite}>Privacy:</Text> Your
                  statement data is never linked to external identities or exposed.
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Got It</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </FinSightShell>
  );
}

/**
 * Individual Category Breakdown Card with Curated Web Thumbnail
 */
function CategoryBreakdownCard({ data, media, index, reducedMotion, onPress }) {
  const {
    category,
    label,
    userSpend,
    median,
    topHandlers,
    percentile,
    isHigh,
    isTopSaver,
  } = data;

  const maxVal = Math.max(median * 1.5, userSpend * 1.1, 1000);
  const userProgress = Math.min(100, Math.max(5, (userSpend / maxVal) * 100));
  const medianProgress = Math.min(100, Math.max(5, (median / maxVal) * 100));
  const topProgress = Math.min(100, Math.max(5, (topHandlers / maxVal) * 100));

  let pillBg = "#F1F5F9";
  let pillBorder = "#CBD5E1";
  let pillText = "#475569";

  if (isHigh) {
    pillBg = "#FFF0F1";
    pillBorder = "rgba(235, 0, 27, 0.3)";
    pillText = "#EB001B";
  } else if (isTopSaver) {
    pillBg = "#FFF7E3";
    pillBorder = "rgba(247, 158, 27, 0.35)";
    pillText = "#B45309";
  }

  return (
    <MotiView
      from={{ opacity: reducedMotion ? 1 : 0.88, translateY: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: "timing",
        duration: reducedMotion ? 1 : 200,
        delay: reducedMotion ? 0 : index * 40,
      }}
      style={{ width: "100%" }}
    >
      <Pressable
        testID={`category-card-${category}`}
        style={({ pressed }) => [
          styles.catCard,
          pressed && styles.pressedScale,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: you spend ${formatCurrency(userSpend)}, peer median is ${formatCurrency(median)}`}
      >
        <View style={styles.catCardHeader}>
          <View style={styles.catCardTitleRow}>
            {media?.image && (
              <Image
                source={{ uri: media.image }}
                style={styles.catThumbnail}
              />
            )}
            <View>
              <Text style={styles.catTitle}>{label}</Text>
              <Text style={styles.catSubTitle}>Discretionary</Text>
            </View>
          </View>
          <View
            style={[
              styles.catPercentilePill,
              { backgroundColor: pillBg, borderColor: pillBorder },
            ]}
          >
            <Text style={[styles.catPercentileText, { color: pillText }]}>
              {percentile}th %ile
            </Text>
          </View>
        </View>

        {/* Spend comparison amounts */}
        <View style={styles.catAmountsRow}>
          <View style={styles.catAmountBlock}>
            <Text style={styles.catAmountLabel}>YOU SPEND</Text>
            <Text
              style={[
                styles.catAmountValue,
                { color: isHigh ? "#EB001B" : isTopSaver ? "#D97706" : "#171717" },
              ]}
            >
              {formatCurrency(userSpend)}
            </Text>
          </View>
          <View style={styles.catAmountBlock}>
            <Text style={styles.catAmountLabel}>PEER MEDIAN</Text>
            <Text style={styles.catAmountValueDim}>
              {formatCurrency(median)}
            </Text>
          </View>
          <View style={styles.catAmountBlock}>
            <Text style={styles.catAmountLabel}>TOP 10%</Text>
            <Text style={[styles.catAmountValueDim, { color: "#D97706" }]}>
              {formatCurrency(topHandlers)}
            </Text>
          </View>
        </View>

        {/* Comparison Progress Bar */}
        <View style={styles.catProgressBarTrack}>
          <View
            style={[
              styles.catProgressBarFill,
              {
                width: `${userProgress}%`,
                backgroundColor: isHigh ? "#EB001B" : isTopSaver ? "#F79E1B" : "#FF5F00",
              },
            ]}
          />
          {/* Median Marker tick */}
          <View
            style={[
              styles.catProgressBarMarker,
              { left: `${medianProgress}%`, backgroundColor: "#94A3B8" },
            ]}
          />
          {/* Top 10% Saver Marker tick */}
          <View
            style={[
              styles.catProgressBarMarker,
              { left: `${topProgress}%`, backgroundColor: "#F79E1B" },
            ]}
          />
        </View>
      </Pressable>
    </MotiView>
  );
}

/**
 * Individual Strategy Recommendation Card
 */
function StrategyCard({ strategy }) {
  const isHigh = strategy.severity === "HIGH";
  const isExcellent = strategy.severity === "EXCELLENT";

  const cardBg = isHigh
    ? "#FFF4F5"
    : isExcellent
      ? "#FFF7E3"
      : "#F8F8F6";

  const borderColor = isHigh
    ? "rgba(235, 0, 27, 0.25)"
    : isExcellent
      ? "rgba(247, 158, 27, 0.3)"
      : "#E3E1DC";

  const iconBg = isHigh
    ? "#FFE0E3"
    : isExcellent
      ? "#FDE68A"
      : "#E2E8F0";

  return (
    <View
      style={[styles.strategyCard, { backgroundColor: cardBg, borderColor }]}
      testID={`strategy-card-${strategy.category}`}
    >
      <View style={styles.strategyTopRow}>
        <View style={[styles.strategyIconBox, { backgroundColor: iconBg }]}>
          {isHigh ? (
            <Flame size={16} color="#EB001B" />
          ) : isExcellent ? (
            <Award size={16} color="#B45309" />
          ) : (
            <Sparkles size={16} color="#EB001B" />
          )}
        </View>
        <View style={styles.strategyHeadlineWrap}>
          <Text style={styles.strategyHeadline}>{strategy.headline}</Text>
          <Text style={styles.strategyAction}>{strategy.action}</Text>
        </View>
      </View>
    </View>
  );
}

function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    backgroundColor: "#F8F8F6",
  },
  titleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  titleTextGroup: {
    flex: 1,
  },
  screenHeading: {
    fontSize: 20,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: -0.4,
  },
  screenSubheading: {
    fontSize: 12,
    color: "#625E59",
    marginTop: 2,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF0F1",
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Segment Switcher */
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F1EE",
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  segmentItemActive: {
    backgroundColor: "#EB001B",
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#625E59",
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  /* Cohort Hero Card */
  cohortHeroCard: {
    height: 150,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    position: "relative",
  },
  cohortHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  cohortHeroContent: {
    flex: 1,
    padding: 15,
    justifyContent: "space-between",
  },
  cohortHeroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cohortHeroTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(247, 158, 27, 0.4)",
  },
  cohortHeroTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F79E1B",
  },
  cohortHeroSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EB001B",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cohortHeroSwitchText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cohortHeroInfo: {
    marginTop: 4,
  },
  cohortHeroName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  cohortHeroTagline: {
    fontSize: 11.5,
    color: "#E2E8F0",
    marginTop: 2,
  },
  cohortHeroBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  peerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  peerAvatarBadge: {
    marginLeft: 8,
  },
  peerAvatarCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  cohortMedianPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cohortMedianLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#CBD5E1",
  },
  cohortMedianValue: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: MONOSPACE,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7E3",
    borderWidth: 1,
    borderColor: "rgba(247, 158, 27, 0.35)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 9,
    marginBottom: 14,
  },
  demoBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: "#92400E",
    lineHeight: 16,
  },

  /* Hero Percentile Card (Mastercard Brand Gradient) */
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  heroGlowCircle: {
    position: "absolute",
    top: -50,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FF5F00",
    opacity: 0.28,
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  heroHeaderTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroSubtitle: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  kdeLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F79E1B",
  },
  kdeLiveText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  percentileDisplayRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginVertical: 4,
  },
  percentileNumber: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1.5,
    fontFamily: MONOSPACE,
  },
  percentileOrdinal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F79E1B",
  },
  percentileUnit: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 1.2,
  },
  stanceBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 8,
  },
  stanceBadgeText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  stanceSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 17,
    marginBottom: 16,
  },
  heroStatsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: MONOSPACE,
  },
  heroStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  /* "Where You Stand" Tier Bar Card */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionHeaderSpaced: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: 0.9,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#625E59",
    marginTop: 2,
  },
  sectionTitleDark: {
    fontSize: 12,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: 0.9,
  },
  sectionSubtitleDark: {
    fontSize: 12,
    color: "#625E59",
    marginTop: 2,
  },
  tierTrackContainer: {
    position: "relative",
    height: 78,
    justifyContent: "center",
    marginVertical: 10,
  },
  tierTrackBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F2F1EE",
    position: "relative",
    overflow: "hidden",
  },
  tierSaverZone: {
    height: "100%",
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
  },
  tierMarkerPin: {
    position: "absolute",
    top: 14,
    alignItems: "center",
    transform: [{ translateX: -18 }],
    width: 36,
  },
  markerLine: {
    width: 2,
    height: 14,
    marginBottom: 2,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 3,
  },
  markerLabel: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  markerSubValue: {
    fontSize: 9,
    color: "#625E59",
    fontFamily: MONOSPACE,
    marginTop: 1,
  },
  userSpendPin: {
    position: "absolute",
    top: -24,
    alignItems: "center",
    transform: [{ translateX: -48 }],
    width: 96,
  },
  userPinBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EB001B",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 4,
  },
  userPulsingCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
  },
  userPinText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: MONOSPACE,
  },
  userPinStem: {
    width: 2,
    height: 12,
    backgroundColor: "#EB001B",
  },
  tierAdviceBox: {
    backgroundColor: "#FFF9F5",
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(247, 158, 27, 0.28)",
  },
  tierAdviceText: {
    fontSize: 12,
    color: "#4F4C48",
    lineHeight: 18,
  },
  highlightGold: {
    color: "#D97706",
    fontWeight: "800",
  },
  highlightRed: {
    color: "#EB001B",
    fontWeight: "800",
  },
  highlightWhite: {
    color: "#171717",
    fontWeight: "900",
  },

  /* Head-to-head battle teaser */
  battleTeaserCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  battleTeaserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  battleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
  },
  battleTeaserTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#171717",
  },
  battleTeaserSub: {
    fontSize: 11.5,
    color: "#625E59",
    marginTop: 2,
  },
  battleTeaserActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  battleTeaserBtn: {
    backgroundColor: "#EB001B",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  battleTeaserBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  shareLinkTeaserBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF0F1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.25)",
  },
  shareLinkTeaserBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EB001B",
  },

  /* Strict Category Grid */
  categoryGrid: {
    gap: 12,
    marginBottom: 18,
  },
  catCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  catCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  catCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  catThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  catTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
  },
  catSubTitle: {
    fontSize: 10.5,
    color: "#625E59",
    marginTop: 1,
  },
  catPercentilePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  catPercentileText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONOSPACE,
  },
  catAmountsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  catAmountBlock: {
    flex: 1,
  },
  catAmountLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#625E59",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  catAmountValue: {
    fontSize: 13.5,
    fontWeight: "900",
    fontFamily: MONOSPACE,
  },
  catAmountValueDim: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#625E59",
    fontFamily: MONOSPACE,
  },
  catProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F2F1EE",
    position: "relative",
    overflow: "hidden",
  },
  catProgressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  catProgressBarMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },

  /* Strategy Section */
  strategySectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  strategySectionTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#EB001B",
    letterSpacing: 0.9,
  },
  strategySectionSubtitle: {
    fontSize: 12,
    color: "#625E59",
    marginTop: 2,
    marginBottom: 14,
  },
  strategyCardsList: {
    gap: 10,
  },
  strategyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  strategyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  strategyIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  strategyHeadlineWrap: {
    flex: 1,
  },
  strategyHeadline: {
    fontSize: 13,
    fontWeight: "800",
    color: "#171717",
    lineHeight: 18,
  },
  strategyAction: {
    fontSize: 11.5,
    color: "#4F4C48",
    lineHeight: 16,
    marginTop: 3,
  },

  /* Leaderboard Styles */
  leaderboardContainer: {
    gap: 14,
    marginBottom: 24,
  },
  leaderboardHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderboardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#171717",
  },
  leaderboardSubtitle: {
    fontSize: 12,
    color: "#625E59",
    marginTop: 2,
  },
  headerShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF0F1",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.25)",
  },
  headerShareBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#EB001B",
  },
  myRankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E1DC",
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  myRankCardTop5: {
    backgroundColor: "#FFF0F1",
    borderColor: "#EB001B",
  },
  myRankBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  myRankBadgeTop5: {
    backgroundColor: "#EB001B",
  },
  myRankNumber: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  myRankInfo: {
    flex: 1,
  },
  myRankName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
  },
  myRankSub: {
    fontSize: 11.5,
    color: "#625E59",
    marginTop: 2,
  },
  shareIconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
  },
  rankersList: {
    gap: 10,
  },
  rankerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rankerCardCurrentUser: {
    borderColor: "#EB001B",
    backgroundColor: "#FFF9F9",
    borderWidth: 1.5,
  },
  rankerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  medalCircle: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  medalText: {
    fontSize: 16,
    fontWeight: "800",
  },
  rankerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#F79E1B",
  },
  userInitialsAvatar: {
    backgroundColor: "#EB001B",
    borderColor: "#EB001B",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitialsText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  rankerMeta: {
    flex: 1,
  },
  rankerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rankerName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#171717",
  },
  youBadge: {
    backgroundColor: "#EB001B",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  rankerCollege: {
    fontSize: 11,
    color: "#625E59",
    marginTop: 1,
  },
  rankerHabit: {
    fontSize: 10.5,
    color: "#4F4C48",
    marginTop: 3,
  },
  rankerRight: {
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 8,
  },
  rankerSpend: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#171717",
    fontFamily: MONOSPACE,
  },
  savingsPill: {
    backgroundColor: "#FFF7E3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
  },
  rankerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  comparePillBtn: {
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
  comparePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EB001B",
  },
  cheerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F2F1EE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  cheerBtnActive: {
    backgroundColor: "#EB001B",
    borderColor: "#EB001B",
  },
  cheerText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#EB001B",
  },
  cheerTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  shareMyRankBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF0F1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  shareMyRankBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EB001B",
  },
  compareLinkBottomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  compareLinkBottomInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  compareLinkBottomTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#171717",
  },
  compareLinkBottomSub: {
    fontSize: 11.5,
    color: "#625E59",
    marginTop: 2,
  },
  compareLinkBottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EB001B",
    paddingVertical: 11,
    borderRadius: 14,
  },
  compareLinkBottomBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* Cities View Styles */
  citiesContainer: {
    gap: 14,
    marginBottom: 24,
  },
  citiesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  citiesTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#171717",
  },
  citiesSub: {
    fontSize: 12,
    color: "#625E59",
    marginTop: 2,
  },
  citiesList: {
    gap: 12,
  },
  cityCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E3E1DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cityCardCurrent: {
    borderColor: "#EB001B",
    backgroundColor: "#FFF9F9",
  },
  cityCardThumb: {
    width: 100,
    height: "100%",
  },
  cityCardBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  cityCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityCardName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#171717",
    flex: 1,
  },
  activePill: {
    backgroundColor: "#EB001B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cityCardRange: {
    fontSize: 11.5,
    color: "#625E59",
  },
  cityMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  cityMetricBlock: {},
  cityMetricLbl: {
    fontSize: 9,
    fontWeight: "700",
    color: "#625E59",
  },
  cityMetricVal: {
    fontSize: 12,
    fontWeight: "900",
    color: "#171717",
    fontFamily: MONOSPACE,
    marginTop: 1,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(23, 23, 23, 0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    padding: 22,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 18,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#171717",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#625E59",
  },
  cohortOptionsList: {
    gap: 10,
    marginBottom: 12,
  },
  cohortOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F6",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    gap: 12,
  },
  cohortOptionRowSelected: {
    borderColor: "#EB001B",
    backgroundColor: "#FFF0F1",
  },
  cohortOptionThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  cohortOptionInfo: {
    flex: 1,
  },
  cohortOptionName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171717",
  },
  cohortOptionNameSelected: {
    color: "#EB001B",
    fontWeight: "900",
  },
  cohortOptionRange: {
    fontSize: 11,
    color: "#625E59",
    marginTop: 2,
  },
  checkPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EB001B",
    alignItems: "center",
    justifyContent: "center",
  },
  infoModalBody: {
    gap: 12,
    marginBottom: 20,
  },
  infoModalParagraph: {
    fontSize: 13,
    color: "#4F4C48",
    lineHeight: 19,
  },
  modalCloseButton: {
    backgroundColor: "#EB001B",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
});
