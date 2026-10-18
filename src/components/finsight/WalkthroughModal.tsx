// src/components/finsight/WalkthroughModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import {
  CreditCard,
  RadioTower,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Check,
  X,
} from '@tamagui/lucide-icons';
import { MastercardMark } from './MastercardMark';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_KEY = '@finsight_walkthrough_completed_v293';

interface WalkthroughStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  accentColor: string;
  highlights: string[];
}

const STEPS: WalkthroughStep[] = [
  {
    id: 'executive_card',
    badge: 'LUXURY FINTECH DESIGN',
    title: 'The Obsidian Black Card',
    subtitle: 'Mastercard Edition with EMV Geometry',
    description:
      'Experience Apple-grade finish with deep obsidian surfaces, tactile EMV micro-chip accents, contactless wave geometry, and real-time financial health rings.',
    icon: CreditCard,
    accentColor: '#EB001B',
    highlights: ['Obsidian Glassmorphism', 'Real-Time Health Score', 'Contactless Wave Dynamics'],
  },
  {
    id: 'realtime_radar',
    badge: 'ZERO-LATENCY RADAR',
    title: 'Real-Time UPI & SMS Engine',
    subtitle: 'Super.money, PhonePe, Paytm, Google Pay & CRED',
    description:
      'Our background notification listener intercepts instant UPI payment alerts and bank SMS directly from your device tray with zero-latency ledger updates.',
    icon: RadioTower,
    accentColor: '#F59E0B',
    highlights: ['Super.money & PhonePe Ready', 'Bank SMS Auto-Parsing', 'Instant Spend Deduplication'],
  },
  {
    id: 'airgap_privacy',
    badge: 'HARDWARE-GRADE SECURITY',
    title: 'Air-Gapped Privacy Engine',
    subtitle: 'Zero Cloud Plaintext Leakage',
    description:
      'Your financial privacy is non-negotiable. Sensitive merchant accounts and raw notifications are stripped of personal identifiers on-device before sync.',
    icon: ShieldCheck,
    accentColor: '#10B981',
    highlights: ['On-Device Fingerprinting', 'Encrypted Local Ledger', 'Deterministic Fraud Defense'],
  },
  {
    id: 'ai_intelligence',
    badge: 'PREDICTIVE REASONING',
    title: 'AI Cashflow & Cohort Mirror',
    subtitle: 'Benchmark Against Verified Financial Peers',
    description:
      'Forecast end-of-month liquidity, detect hidden subscription leaks, and see how your savings rank against top-tier demographic peer groups.',
    icon: Sparkles,
    accentColor: '#8B5CF6',
    highlights: ['Cashflow Anomaly Radar', 'Peer Benchmark Percentile', 'Interactive Goal Simulator'],
  },
];

interface WalkthroughModalProps {
  visible?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export function WalkthroughModal({ visible: externalVisible, onClose, forceShow = false }: WalkthroughModalProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setInternalVisible(true);
      setCurrentIndex(0);
      return;
    }

    // Auto-display on fresh launch
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY);
        if (!seen) {
          setInternalVisible(true);
        }
      } catch (_) {}
    })();
  }, [forceShow]);

  const isVisible = externalVisible !== undefined ? externalVisible : internalVisible;

  const handleDismiss = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (_) {}
    setInternalVisible(false);
    if (onClose) onClose();
  };

  const handleNext = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (_) {}

    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await handleDismiss();
    }
  };

  const handlePrev = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (_) {}
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const step = STEPS[currentIndex];
  const isLast = currentIndex === STEPS.length - 1;
  const StepIcon = step.icon;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, scale: 0.95, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 250 }}
          style={styles.modalCard}
        >
          {/* Top Bar with Dismiss */}
          <View style={styles.topBar}>
            <View style={styles.badgeContainer}>
              <View style={[styles.badgeDot, { backgroundColor: step.accentColor }]} />
              <Text style={[styles.badgeText, { color: step.accentColor }]}>{step.badge}</Text>
            </View>
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Close Walkthrough"
            >
              <X size={18} color="#FFFFFF" opacity={0.7} />
            </Pressable>
          </View>

          {/* Icon Stage */}
          <View style={styles.iconStage}>
            <View style={[styles.iconHalo, { borderColor: `${step.accentColor}33` }]}>
              <View style={[styles.iconCore, { backgroundColor: `${step.accentColor}1A` }]}>
                {step.id === 'executive_card' ? (
                  <View style={styles.mastercardRow}>
                    <MastercardMark size={30} />
                  </View>
                ) : (
                  <StepIcon size={34} color={step.accentColor} strokeWidth={2.4} />
                )}
              </View>
            </View>
          </View>

          {/* Typography */}
          <View style={styles.contentBody}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.subtitle}>{step.subtitle}</Text>
            <Text style={styles.description}>{step.description}</Text>

            {/* Feature Highlights Pills */}
            <View style={styles.highlightsRow}>
              {step.highlights.map((item) => (
                <View key={item} style={styles.highlightPill}>
                  <Check size={11} color={step.accentColor} strokeWidth={2.8} />
                  <Text style={styles.highlightText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Step Indicators */}
            <View style={styles.dotsRow}>
              {STEPS.map((s, idx) => (
                <Pressable
                  key={s.id}
                  onPress={() => setCurrentIndex(idx)}
                  style={[
                    styles.dot,
                    idx === currentIndex
                      ? [styles.activeDot, { backgroundColor: step.accentColor }]
                      : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {currentIndex > 0 ? (
                <Pressable
                  onPress={handlePrev}
                  style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleDismiss}
                  style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.backButtonText}>Skip</Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.nextButton,
                  { backgroundColor: step.accentColor },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.nextButtonText}>
                  {isLast ? 'Explore FInsightAI' : 'Next Step'}
                </Text>
                <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.6} />
              </Pressable>
            </View>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F1116',
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 9999,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  closeButton: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconStage: {
    alignItems: 'center',
    marginVertical: 18,
  },
  iconHalo: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mastercardRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    lineHeight: 19.5,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.7,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  highlightText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomControls: {
    marginTop: 22,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

export default WalkthroughModal;
