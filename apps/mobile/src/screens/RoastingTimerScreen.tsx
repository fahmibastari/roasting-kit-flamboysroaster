import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Vibration, ActivityIndicator, Platform, StatusBar
} from 'react-native';
import Slider from '@react-native-community/slider';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useKeepAwake } from 'expo-keep-awake';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, LAYOUT } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RoastingTimerScreen({ route, navigation }: any) {
  useKeepAwake();
  const { batchId, beanName, initialTemp, initialAirflow, targetDrop } = route.params;

  const [hasStarted, setHasStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [temp, setTemp] = useState(initialTemp || 200);
  const [airflow, setAirflow] = useState(initialAirflow || 0);
  const [logs, setLogs] = useState<any[]>([]);
  const [firstCrackTime, setFirstCrackTime] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const isOverTime = seconds >= 900; // 15 mins

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      if (isOverTime && seconds % 5 === 0) Vibration.vibrate([0, 500, 200, 500]);
      else if (!isOverTime && seconds % 30 === 0) Vibration.vibrate(500);
    }
  }, [seconds, isActive, isOverTime]);

  const handleStart = () => {
    setHasStarted(true);
    setIsActive(true);
    handleLog(false);
  };

  const handleLog = async (isFC = false) => {
    const payload = {
      timeIndex: seconds,
      temperature: temp,
      airflow: airflow,
      isFirstCrack: isFC
    };
    try {
      const newLog = { ...payload, id: Date.now().toString() };
      setLogs([newLog, ...logs]);
      api.post(`/roasting/${batchId}/log`, payload).catch(err => console.error(err));

      if (isFC) {
        setFirstCrackTime(formatTime(seconds));
        Alert.alert("First Crack!", "Recorded at " + formatTime(seconds));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFinish = () => {
    setIsActive(false);
    setIsFinished(true);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) return Alert.alert("Permission Denied", "Camera access is required.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.5,
    });
    if (!result.canceled) uploadResult(result.assets[0].uri);
  };

  const uploadResult = async (photoUri?: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('finalTime', formatTime(seconds));
      formData.append('finalTemp', temp.toString());

      if (photoUri) {
        const filename = photoUri.split('/').pop() || `roast-${batchId}.jpg`;
        // @ts-ignore
        formData.append('photo', {
          uri: Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri,
          name: filename,
          type: 'image/jpeg',
        });
      }

      await api.patch(`/roasting/${batchId}/finish`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("Success! 🎉", "Stock Updated. Roasting Completed.", [
        { text: "Back to Home", onPress: () => navigation.popToTop() }
      ]);
    } catch (error: any) {
      console.log("UPLOAD ERROR:", error);
      const serverMsg = error.response?.data?.message || "Check server connection.";
      Alert.alert("Upload Failed", String(serverMsg));
      setIsUploading(false);
    }
  };

  if (isUploading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 20, color: COLORS.textSecondary }}>Persisting Data...</Text>
      </View>
    );
  }

  // --- SUMMARY SCREEN ---
  if (isFinished) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={48} color={COLORS.digitalGreen} />
            </View>
            <Text style={styles.summaryTitle}>ROAST COMPLETE</Text>
            <Text style={styles.summarySubtitle}>{beanName}</Text>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>DURATION</Text>
                <Text style={styles.summaryValue}>{formatTime(seconds)}</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>FINAL TEMP</Text>
                <Text style={styles.summaryValue}>{temp}°C</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.btnCamera} onPress={openCamera} activeOpacity={0.8}>
              <View style={styles.cameraIconBg}>
                <Ionicons name="camera" size={24} color={COLORS.instrumentBg} />
              </View>
              <Text style={styles.btnCameraText}>CAPTURE PROOF & SAVE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => uploadResult(undefined)}>
              <Text style={styles.skipText}>Submit Without Photo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryFooter}>Data will be synced to cloud instantly.</Text>
        </View>
      </View>
    );
  }

  // --- START SCREEN ---
  if (!hasStarted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.startWrapper}>
          <View style={styles.startHeader}>
            <Text style={styles.startLabel}>READY FOR BATCH</Text>
            <Text style={styles.startBean}>{beanName}</Text>
          </View>

          <View style={styles.startCircle}>
            <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
              <Ionicons name="power" size={64} color={COLORS.digitalRed} />
              <Text style={styles.startBtnText}>CHARGE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paramsRow}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>CHARGE</Text>
              <Text style={styles.paramValue}>{initialTemp}°C</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>AIRFLOW</Text>
              <Text style={styles.paramValue}>{initialAirflow}%</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // --- FLIGHT DECK (MAIN TIMER) ---
  return (
    <View style={styles.deckContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.instrumentBg} />

      {/* 1. HUD Area */}
      <View style={styles.hud}>
        <View style={styles.hudTop}>
          <View>
            <Text style={styles.hudLabel}>ELAPSED TIME</Text>
            <Text style={styles.hudTimer}>{formatTime(seconds)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.hudLabel}>BEAN TEMP</Text>
            <Text style={[styles.hudTemp, { color: temp > 200 ? COLORS.digitalRed : COLORS.digitalGreen }]}>
              {temp}°
            </Text>
          </View>
        </View>
        <View style={styles.hudMeta}>
          <Text style={styles.metaText}>TARGET: {targetDrop || '-'}°C</Text>
          <Text style={styles.metaText}>AIRFLOW: {airflow}%</Text>
          {firstCrackTime && <Text style={[styles.metaText, { color: COLORS.digitalAmber }]}>FC: {firstCrackTime}</Text>}
        </View>
      </View>

      {/* 2. Timeline / Logs */}
      <ScrollView style={styles.logContainer} contentContainerStyle={{ padding: SPACING.md }}>
        <Text style={styles.logHeader}>FLIGHT LOG</Text>
        {logs.map((log, index) => (
          <View key={log.id} style={styles.logRow}>
            <View style={styles.timeCol}>
              <Text style={styles.logTime}>{formatTime(log.timeIndex)}</Text>
              <View style={styles.timelineDot} />
              {index !== logs.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={[styles.logCard, log.isFirstCrack && styles.logCardFC]}>
              <Text style={[styles.logText, log.isFirstCrack && styles.logTextFC]}>
                Temp {log.temperature}°C   |   Air {log.airflow}%
              </Text>
              {log.isFirstCrack && <Text style={styles.fcTag}>FIRST CRACK</Text>}
            </View>
          </View>
        ))}
        {logs.length === 0 && <Text style={styles.emptyLog}>Waiting for data points...</Text>}
      </ScrollView>

      {/* 3. Control Deck */}
      <View style={styles.controlDeck}>
        {/* Temp Controls */}
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>TEMPERATURE INPUT</Text>
          <View style={styles.tempControlRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => setTemp(Math.max(0, temp - 1))}>
              <Ionicons name="remove" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <Slider
              style={{ flex: 1, marginHorizontal: 10, height: 40 }}
              minimumValue={0} maximumValue={300} step={1}
              value={temp} onValueChange={setTemp}
              minimumTrackTintColor={COLORS.digitalRed}
              maximumTrackTintColor={COLORS.slateLight}
              thumbTintColor={COLORS.digitalRed}
            />

            <TouchableOpacity style={styles.adjustBtn} onPress={() => setTemp(Math.min(300, temp + 1))}>
              <Ionicons name="add" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Airflow Controls */}
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>AIRFLOW DAMPER</Text>
          <View style={styles.afRow}>
            {[0, 25, 50, 75, 100].map((val) => (
              <TouchableOpacity
                key={val} style={[styles.afKey, airflow === val && styles.afKeyActive]}
                onPress={() => setAirflow(val)}
              >
                <Text style={[styles.afKeyText, airflow === val && styles.afKeyTextActive]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tactical Buttons */}
        <View style={styles.tacticalRow}>
          <TouchableOpacity style={styles.tacticalBtn} onPress={() => handleLog(false)}>
            <Text style={styles.tacticalText}>MARK LOG</Text>
          </TouchableOpacity>

          {!firstCrackTime && (
            <TouchableOpacity style={[styles.tacticalBtn, styles.fcBtn]} onPress={() => handleLog(true)}>
              <Text style={[styles.tacticalText, { color: COLORS.instrumentBg }]}>MARK FC</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.tacticalBtn, styles.stopBtn]} onPress={handleFinish}>
            <Ionicons name="stop" size={16} color="#fff" />
            <Text style={styles.tacticalText}>STOP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.instrumentBg },
  center: { justifyContent: 'center', alignItems: 'center' },

  // START SCREEN
  startWrapper: { flex: 1, justifyContent: 'space-between', padding: SPACING.xl, backgroundColor: COLORS.instrumentBg },
  startHeader: { marginTop: 60, alignItems: 'center' },
  startLabel: { color: COLORS.textMuted, letterSpacing: 2, fontSize: 14, fontWeight: 'bold' },
  startBean: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: SPACING.sm, textAlign: 'center' },

  startCircle: { alignSelf: 'center', marginVertical: 40 },
  startButton: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.slate,
    borderWidth: 4, borderColor: COLORS.digitalRed,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.lg,
    shadowColor: COLORS.digitalRed,
    shadowOpacity: 0.4
  },
  startBtnText: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 10, letterSpacing: 2 },

  paramsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  paramItem: { alignItems: 'center' },
  paramLabel: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  paramValue: { color: COLORS.digitalGreen, fontSize: 24, fontWeight: 'bold', fontVariant: ['tabular-nums'] },

  // FLIGHT DECK
  deckContainer: { flex: 1, backgroundColor: COLORS.instrumentBg },
  hud: {
    paddingTop: 50, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.slate,
    borderBottomWidth: 1, borderBottomColor: COLORS.slateLight,
    ...SHADOWS.md
  },
  hudTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hudLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  hudTimer: { color: '#fff', fontSize: 56, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  hudTemp: { fontSize: 56, fontWeight: 'bold', fontVariant: ['tabular-nums'] },

  hudMeta: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm },
  metaText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },

  logContainer: { flex: 1, backgroundColor: COLORS.instrumentBg },
  logHeader: { color: COLORS.slateLight, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginVertical: SPACING.md },
  emptyLog: { color: COLORS.slateLight, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },

  logRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  timeCol: { width: 60, alignItems: 'flex-end', paddingRight: 10, position: 'relative' },
  logTime: { color: COLORS.textMuted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  timelineDot: { position: 'absolute', right: -4, top: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.slateLight },
  timelineLine: { position: 'absolute', right: -1, top: 12, width: 2, height: 40, backgroundColor: COLORS.slateLight },

  logCard: { flex: 1, backgroundColor: COLORS.slate, padding: SPACING.sm, borderRadius: 8 },
  logCardFC: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: COLORS.digitalAmber },
  logText: { color: '#fff', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  logTextFC: { color: COLORS.digitalAmber, fontWeight: 'bold' },
  fcTag: { position: 'absolute', right: 8, top: 8, color: COLORS.digitalAmber, fontSize: 10, fontWeight: '900' },

  // CONTROL DECK
  controlDeck: { backgroundColor: COLORS.slate, padding: SPACING.md, paddingBottom: 40, borderTopWidth: 1, borderTopColor: COLORS.slateLight },
  controlRow: { marginBottom: SPACING.md },
  controlLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  tempControlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.instrumentBg, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: COLORS.slateLight },
  adjustBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.slateLight, borderRadius: 8 },

  afRow: { flexDirection: 'row', gap: 8 },
  afKey: { flex: 1, backgroundColor: COLORS.instrumentBg, paddingVertical: 10, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: COLORS.slateLight },
  afKeyActive: { backgroundColor: COLORS.digitalGreen, borderColor: COLORS.digitalGreen },
  afKeyText: { color: COLORS.textMuted, fontSize: 12, fontWeight: 'bold' },
  afKeyTextActive: { color: '#fff' },

  tacticalRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xs },
  tacticalBtn: { flex: 1, backgroundColor: COLORS.slateLight, paddingVertical: 14, alignItems: 'center', borderRadius: 8, justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tacticalText: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  fcBtn: { backgroundColor: COLORS.digitalAmber },
  stopBtn: { backgroundColor: COLORS.digitalRed, flex: 0.6 },

  // SUMMARY
  summaryContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: SPACING.lg },
  summaryCard: { backgroundColor: '#fff', borderRadius: 24, padding: SPACING.xl, alignItems: 'center', ...SHADOWS.lg },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  summaryTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  summarySubtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: SPACING.xl },

  summaryGrid: { flexDirection: 'row', marginBottom: SPACING.xl, alignItems: 'center' },
  summaryItem: { paddingHorizontal: SPACING.lg, alignItems: 'center' },
  dividerVertical: { width: 1, height: 40, backgroundColor: COLORS.border },
  summaryLabel: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 4 },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },

  btnCamera: { flexDirection: 'row', backgroundColor: COLORS.textPrimary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 100, alignItems: 'center', gap: 12, ...SHADOWS.md },
  cameraIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  btnCameraText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  summaryFooter: { textAlign: 'center', marginTop: SPACING.lg, color: COLORS.textMuted, fontSize: 12 },
  skipBtn: { marginTop: 20, padding: 10 },
  skipText: { color: COLORS.textMuted, fontSize: 14, textDecorationLine: 'underline', textAlign: 'center' }
});