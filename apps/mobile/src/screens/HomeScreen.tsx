import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, StatusBar, Modal, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, LAYOUT } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({ navigation, route }: any) {
  const [roasterName, setRoasterName] = useState(route.params?.roasterName || 'Roaster');
  const [roasterId, setRoasterId] = useState(route.params?.roasterId || null);

  const [beans, setBeans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBean, setSelectedBean] = useState<string | null>(null);

  // --- FORM INPUT LENGKAP ---
  const [batchNo, setBatchNo] = useState('');
  const [weight, setWeight] = useState('1300');
  const [density, setDensity] = useState('');
  const [targetProfile, setTargetProfile] = useState('');
  const [targetDropTemp, setTargetDropTemp] = useState('');
  const [chargeTemp, setChargeTemp] = useState('200');
  const [initialAirflow, setInitialAirflow] = useState('0');

  // --- RESTOCK STATE ---
  const [showRestock, setShowRestock] = useState(false);
  const [restockBean, setRestockBean] = useState<any>(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [restockPhoto, setRestockPhoto] = useState<string | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockType, setRestockType] = useState<'GB' | 'RB'>('GB');

  // --- CREATE BEAN STATE ---
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStockGB, setNewStockGB] = useState('');
  const [newStockRB, setNewStockRB] = useState('0');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // --- ACTIVE ROAST STATE ---
  const [activeBatch, setActiveBatch] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const checkSession = async () => {
        const jsonValue = await SecureStore.getItemAsync('user_session');
        if (jsonValue) {
          const user = JSON.parse(jsonValue);
          setRoasterId(user.id);
          setRoasterName(user.fullName?.split(' ')[0] || 'Roaster');
          return user.id;
        }
        return null;
      };

      const fetchData = async () => {
        try {
          const uId = await checkSession();

          // 1. Fetch Beans
          const resBeans = await api.get('/beans');
          setBeans(resBeans.data);
          setLoading(false);

          // 2. Check Active Roast (kalo uId ada)
          if (uId) {
            const resActive = await api.get(`/roasting/state/inprogress/${uId}`);
            if (resActive.data) {
              setActiveBatch(resActive.data);
            } else {
              setActiveBatch(null);
            }
          }

        } catch (error) {
          console.log(error);
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  const handleResume = () => {
    if (!activeBatch) return;
    navigation.navigate('Timer', {
      batchId: activeBatch.id,
      beanName: activeBatch.beanType?.name || 'Unknown Bean',
      initialTemp: 200, // Default, nanti di Timer bisa fetch ulang kalo niat
      initialAirflow: 0,
      targetDrop: activeBatch.targetProfile || '-'
    });
  };

  const handleStartRoasting = async () => {
    if (!roasterId) return Alert.alert('Session Error', 'Please logout and login again.');
    if (!selectedBean || !batchNo || !weight || !density || !targetProfile || !targetDropTemp || !chargeTemp) {
      return Alert.alert('Missing Data', 'Please fill in all roasting parameters to proceed.');
    }

    try {
      const res = await api.post('/roasting', {
        batchNumber: parseInt(batchNo),
        initialWeight: parseInt(weight),
        density: parseFloat(density),
        targetProfile: targetProfile,
        beanTypeId: selectedBean,
        roasterId: roasterId
      });

      const beanName = beans.find(b => b.id === selectedBean)?.name;

      navigation.navigate('Timer', {
        batchId: res.data.id,
        beanName,
        initialTemp: parseInt(chargeTemp),
        initialAirflow: parseInt(initialAirflow),
        targetDrop: targetDropTemp
      });

    } catch (error: any) {
      let msg = "Check network connection.";
      const errData = error.response?.data;
      if (errData?.message) msg = Array.isArray(errData.message) ? errData.message.join('\n') : String(errData.message);
      Alert.alert("Start Failed", msg);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logging Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: 'destructive', onPress: async () => {
          await SecureStore.deleteItemAsync('user_session');
          await SecureStore.deleteItemAsync('user_token');
          navigation.replace('Login');
        }
      }
    ])
  }

  // --- RESTOCK HANDLERS ---
  const handleOpenRestock = (bean: any) => {
    setRestockBean(bean);
    setRestockAmount('');
    setRestockPhoto(null);
    setRestockType('GB');
    setShowRestock(true);
  };

  const handleRestockCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Sorry", "We need camera permissions.");

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) setRestockPhoto(result.assets[0].uri);
  };

  const handleRestockSubmit = async () => {
    if (!restockAmount) return Alert.alert("Missing Data", "Please enter amount (kg/g).");

    setIsRestocking(true);
    try {
      const formData = new FormData();
      formData.append('amount', restockAmount);
      formData.append('type', restockType);

      if (restockPhoto) {
        const filename = restockPhoto.split('/').pop() || `restock-${Date.now()}.jpg`;
        // @ts-ignore
        formData.append('photo', {
          uri: Platform.OS === 'ios' ? restockPhoto.replace('file://', '') : restockPhoto,
          name: filename,
          type: 'image/jpeg',
        });
      }

      await api.patch(`/beans/${restockBean.id}/restock`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("Success", "Stock Updated!", [{
        text: "OK", onPress: () => {
          setIsRestocking(false);
          setShowRestock(false);
          // Refresh Beans
          const fetchBeans = async () => {
            const res = await api.get('/beans');
            setBeans(res.data);
          };
          fetchBeans();
        }
      }]);

    } catch (error: any) {
      console.log("RESTOCK ERROR:", error);
      Alert.alert("Failed", "Could not update stock.");
      setIsRestocking(false);
    }
  };

  // --- CREATE BEAN HANDLERS ---
  const handleOpenCreate = () => {
    setNewName('');
    setNewStockGB('');
    setNewStockRB('0');
    setNewPhoto(null);
    setShowCreate(true);
  };

  const handleCreateCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Sorry", "We need camera permissions.");

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) setNewPhoto(result.assets[0].uri);
  };

  const handleCreateSubmit = async () => {
    if (!newName || !newStockGB) return Alert.alert("Missing Data", "Name and Green Stock are required.");

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('stockGB', newStockGB); // Backend will cast to number
      formData.append('stockRB', newStockRB); // Backend will cast to number

      if (newPhoto) {
        const filename = newPhoto.split('/').pop() || `new-bean-${Date.now()}.jpg`;
        // @ts-ignore
        formData.append('photo', {
          uri: Platform.OS === 'ios' ? newPhoto.replace('file://', '') : newPhoto,
          name: filename,
          type: 'image/jpeg',
        });
      }

      await api.post('/beans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("Success", "New Bean Added!", [{
        text: "OK", onPress: () => {
          setIsCreating(false);
          setShowCreate(false);
          // Refresh
          const fetchBeans = async () => {
            const res = await api.get('/beans');
            setBeans(res.data);
          };
          fetchBeans();
        }
      }]);
    } catch (error: any) {
      console.log("CREATE ERROR:", error);
      Alert.alert("Failed", "Could not create bean.");
      setIsCreating(false);
    }
  };

  // --- ACTIVE ROAST TIMER LOGIC ---
  const [timerDisplay, setTimerDisplay] = useState('00:00');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startTimer = async () => {
      if (!activeBatch) return;

      // Coba ambil waktu mulai REAL dari SecureStore
      const storedStart = await SecureStore.getItemAsync(`roast_start_${activeBatch.id}`);

      if (storedStart) {
        const startTime = parseInt(storedStart);

        const updateTimer = () => {
          const now = Date.now();
          const diff = Math.floor((now - startTime) / 1000);
          if (diff >= 0) {
            const m = Math.floor(diff / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setTimerDisplay(`${m}:${s}`);
          }
        };
        updateTimer();
        interval = setInterval(updateTimer, 1000);
      } else {
        // Kalau tidak ada di SecureStore, berarti BELUM start (masih di layar Ready)
        // Atau sudah selesai tapi API belum update (rare case)
        setTimerDisplay('WAITING...');
      }
    };

    startTimer();

    return () => { if (interval) clearInterval(interval); };
  }, [activeBatch]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>ROASTER STATION</Text>
          <Text style={styles.headerTitle}>Hello, {roasterName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 0. ACTIVE SESSION CARD (New) */}
        {activeBatch && (
          <View style={{ marginBottom: SPACING.xl, padding: SPACING.md, backgroundColor: COLORS.digitalRed, borderRadius: LAYOUT.borderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>ROAST IN PROGRESS</Text>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{timerDisplay}</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Batch #{activeBatch.batchNumber}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{activeBatch.beanType?.name}</Text>
            </View>
            <TouchableOpacity
              onPress={handleResume}
              style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: COLORS.digitalRed, fontWeight: 'bold' }}>RESUME</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1. BEAN SELECTOR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SELECT BEAN</Text>
          <Text style={styles.sectionSubtitle}>{beans.length} ORIGINS AVAILABLE</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ height: 200 }} /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.beanList}>
            {beans.map((bean) => (
              <TouchableOpacity
                key={bean.id}
                style={[styles.beanCard, selectedBean === bean.id && styles.beanCardActive]}
                onPress={() => setSelectedBean(bean.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: bean.sackPhotoUrl || 'https://placehold.co/200' }}
                  style={[styles.beanImage, selectedBean === bean.id && { opacity: 1 }]}
                />
                <View style={styles.beanOverlay}>
                  <View style={styles.stockTag}>
                    <Text style={styles.stockText}>{bean.stockGB.toLocaleString()}g</Text>
                  </View>
                  <Text style={styles.beanName} numberOfLines={2}>{bean.name}</Text>
                </View>
                {selectedBean === bean.id && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}

                {/* RESTOCK BUTTON */}
                <TouchableOpacity style={styles.restockBtn} onPress={() => handleOpenRestock(bean)}>
                  <Ionicons name="add" size={16} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* CREATE NEW CARD */}
            <TouchableOpacity
              style={[styles.beanCard, styles.createCard]}
              onPress={handleOpenCreate}
              activeOpacity={0.8}
            >
              <View style={styles.createIconBg}>
                <Ionicons name="add" size={32} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.createLabel}>ADD NEW BEAN</Text>
            </TouchableOpacity>

          </ScrollView>
        )}

        {/* 2. CONFIGURATION CARD */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ROAST CONFIG</Text>
        </View>

        <View style={styles.configCard}>
          {/* Batch Info */}
          <View style={[styles.row, { marginBottom: SPACING.lg }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BATCH #</Text>
              <TextInput
                style={styles.input}
                value={batchNo}
                onChangeText={setBatchNo}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WEIGHT (g)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="1300"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DENSITY</Text>
              <TextInput
                style={styles.input}
                value={density}
                onChangeText={setDensity}
                placeholder="700"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Profile Info */}
          <View style={[styles.row, { marginBottom: SPACING.lg }]}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>TARGET PROFILE</Text>
              <TextInput
                style={styles.input}
                value={targetProfile}
                onChangeText={setTargetProfile}
                placeholder="e.g. Filter Light"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DROP TEMP</Text>
              <TextInput
                style={styles.input}
                value={targetDropTemp}
                onChangeText={setTargetDropTemp}
                placeholder="210"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Machine State */}
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CHARGE TEMP (°C)</Text>
              <TextInput
                style={[styles.input, styles.inputHighlight]}
                value={chargeTemp}
                onChangeText={setChargeTemp}
                placeholder="200"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>INIT AIRFLOW</Text>
              <View style={{ flexDirection: 'row', height: 48, backgroundColor: COLORS.surfaceHighlight, borderRadius: LAYOUT.borderRadius.md, padding: 3, gap: 2 }}>
                {['0', '25', '50', '75', '100'].map((val) => {
                  const isActive = initialAirflow === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setInitialAirflow(val)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? '#fff' : 'transparent',
                        borderRadius: LAYOUT.borderRadius.sm - 2,
                        borderWidth: isActive ? 1 : 0,
                        borderColor: COLORS.border,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isActive ? 0.1 : 0,
                        shadowRadius: 1,
                        elevation: isActive ? 1 : 0
                      }}>
                      <Text style={{ fontSize: 12, fontWeight: isActive ? '800' : '600', color: isActive ? COLORS.textPrimary : COLORS.textMuted }}>{val}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* 3. ACTION */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStartRoasting} activeOpacity={0.9}>
          <Text style={styles.startBtnText}>INITIALIZE ROAST</Text>
          <Ionicons name="arrow-forward" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
      </ScrollView>

      {/* RESTOCK MODAL */}
      <Modal visible={showRestock} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>RESTOCK BEAN</Text>

            {/* TYPE SELECTOR */}
            <View style={{ flexDirection: 'row', marginBottom: 16, backgroundColor: COLORS.surfaceHighlight, padding: 4, borderRadius: 8 }}>
              <TouchableOpacity
                onPress={() => setRestockType('GB')}
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: restockType === 'GB' ? COLORS.surface : 'transparent', elevation: restockType === 'GB' ? 2 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: restockType === 'GB' ? COLORS.textPrimary : COLORS.textMuted }}>GREEN BEAN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRestockType('RB')}
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: restockType === 'RB' ? COLORS.primary : 'transparent', elevation: restockType === 'RB' ? 2 : 0 }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: restockType === 'RB' ? '#fff' : COLORS.textMuted }}>ROASTED</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>AMOUNT (g)</Text>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              value={restockAmount}
              onChangeText={setRestockAmount}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              autoFocus
            />

            <Text style={[styles.label, { marginTop: 16 }]}>SACK PHOTO (OPTIONAL)</Text>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleRestockCamera}>
              {restockPhoto ? (
                <Image source={{ uri: restockPhoto }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
              ) : (
                <>
                  <Ionicons name="camera" size={24} color={COLORS.textMuted} />
                  <Text style={styles.cameraBtnText}>Take Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setShowRestock(false)}>
                <Text style={styles.btnTextMuted}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleRestockSubmit}>
                {isRestocking ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextInverse}>CONFIRM</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE BEAN MODAL */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ADD NEW BEAN</Text>

            <Text style={styles.label}>BEAN NAME</Text>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Ethiopia Guji"
              autoFocus
            />

            <View style={[styles.row, { marginBottom: 12 }]}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>STOCK (GREEN)</Text>
                <TextInput
                  style={styles.input}
                  value={newStockGB}
                  onChangeText={setNewStockGB}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>STOCK (ROAST)</Text>
                <TextInput
                  style={styles.input}
                  value={newStockRB}
                  onChangeText={setNewStockRB}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 4 }]}>SACK PHOTO (OPTIONAL)</Text>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleCreateCamera}>
              {newPhoto ? (
                <Image source={{ uri: newPhoto }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
              ) : (
                <>
                  <Ionicons name="camera" size={24} color={COLORS.textMuted} />
                  <Text style={styles.cameraBtnText}>Take Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setShowCreate(false)}>
                <Text style={styles.btnTextMuted}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleCreateSubmit}>
                {isCreating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextInverse}>CREATE</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl * 1.5,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted, marginBottom: 2 },
  headerTitle: { ...TYPOGRAPHY.header, fontSize: 22 },
  iconBtn: { padding: 8, backgroundColor: COLORS.surfaceHighlight, borderRadius: 12 },

  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACING.md, marginTop: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.subheader, fontSize: 16, letterSpacing: 0.5 },
  sectionSubtitle: { ...TYPOGRAPHY.label, fontWeight: '600' },

  beanList: { paddingRight: SPACING.lg },
  beanCard: {
    width: 160,
    height: 220,
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.lg,
    marginRight: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.sm
  },
  beanCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.md
  },
  beanImage: { width: '100%', height: '100%', opacity: 0.8 },
  beanOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)', // Gradient overlay simulation
  },
  stockTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  stockText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  beanName: { color: '#fff', fontWeight: '700', fontSize: 16, lineHeight: 20 },
  checkBadge: {
    position: 'absolute',
    top: 10, right: 10,
    backgroundColor: COLORS.primary,
    width: 24, height: 24,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff'
  },

  configCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  row: { flexDirection: 'row', gap: SPACING.md },
  inputGroup: { flex: 1 },
  label: { ...TYPOGRAPHY.label, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surfaceHighlight,
    height: 48,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  inputHighlight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },

  startBtn: {
    backgroundColor: COLORS.textPrimary, // Stone 900
    marginTop: SPACING.xl,
    height: 60,
    borderRadius: LAYOUT.borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.lg
  },
  startBtnText: { color: COLORS.textInverse, fontWeight: '800', fontSize: 16, letterSpacing: 1.5 },

  // RESTOCK STYLES
  restockBtn: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: SPACING.xl, ...SHADOWS.lg },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.lg, textAlign: 'center' },
  cameraBtn: { height: 120, backgroundColor: COLORS.surfaceHighlight, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border },
  cameraBtnText: { color: COLORS.textMuted, fontSize: 12, marginTop: 8 },
  btn: { flex: 1, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { backgroundColor: COLORS.surfaceHighlight },
  btnSubmit: { backgroundColor: COLORS.textPrimary },
  btnTextMuted: { fontWeight: 'bold', color: COLORS.textSecondary },
  btnTextInverse: { fontWeight: 'bold', color: '#fff' },

  // CREATE CARD STYLES
  createCard: { backgroundColor: COLORS.surfaceHighlight, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border },
  createIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  createLabel: { ...TYPOGRAPHY.label, color: COLORS.textMuted }
});